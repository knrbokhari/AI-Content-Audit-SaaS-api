import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ChangePasswordDto,
  ForgetPasswordDto,
  RegisterDto,
  ResendOtpDto,
  ResetPasswordDto,
  Verify2FA,
  VerifyEmailDto,
} from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from 'src/email/email.service';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private email: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const domain = dto.email.split('@')[1];

    const existingOrg = await this.prisma.organization.findFirst({
      where: { domain },
    });
    if (existingOrg)
      throw new BadRequestException(
        'An organization with this email domain already exists',
      );

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new BadRequestException('Email already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const orgName = dto.orgName ?? `${dto.name}'s Organization`;
    const code = this.generateNumericOTP(6);
    const codeExpires = new Date(Date.now() + OTP_TTL_MS);

    await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: orgName, domain, country: dto.country },
      });

      const role = await tx.role.create({
        data: {
          name: 'Super Admin',
          slug: 'super_admin',
          organizationId: org.id,
          isSystem: true,
        },
      });

      await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          organizationId: org.id,
          roleId: role.id,
          phone: dto.phone,
          code,
          reset_password_expires: codeExpires,
        },
      });
    });

    await this.email.sendVerifyEmail(dto.email, dto.name, code);
    return { message: 'OTP sent. Please verify your email.', success: true };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.is_verify) throw new BadRequestException('Email already verified');

    if (
      user.code !== dto.code ||
      !user.reset_password_expires ||
      user.reset_password_expires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { is_verify: true, code: null, reset_password_expires: null },
    });

    return { message: 'Email verified successfully', success: true };
  }

  async resendOtp(dto: ResendOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.is_verify) throw new BadRequestException('Email already verified');

    const code = this.generateNumericOTP(6);
    const codeExpires = new Date(Date.now() + OTP_TTL_MS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { code, reset_password_expires: codeExpires },
    });

    await this.email.sendResendOtp(dto.email, user.name, code);
    return { message: 'OTP resent successfully', success: true };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true, organization: true },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.is_verify)
      throw new BadRequestException(
        'Please verify your email before logging in',
      );

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    if (user.is_2fa_active) {
      const tempToken = this.signToken(user.id, user.email);

      if (!user.secret) {
        const secret = speakeasy.generateSecret({
          length: 20,
          name: `ContentPilot AI: ${user.email}`,
        });

        await this.prisma.user.update({
          where: { id: user.id },
          data: { secret: secret.base32 },
        });

        return {
          requires2FA: true,
          otpauth_url: secret.otpauth_url,
          secret: secret.base32,
          email: user.email,
          tempToken,
        };
      }

      return { requires2FA: true, tempToken };
    }

    const permissions = await this.getUserPermissions(user.roleId);
    return { token: this.signToken(user.id, user.email), permissions };
  }

  async login2FA(dto: Verify2FA) {
    const decoded = this.jwtService.verify<{ sub: number }>(dto.tempToken);

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.is_2fa_active || !user.secret)
      throw new BadRequestException('2FA is not enabled for this account');

    const valid = speakeasy.totp.verify({
      secret: user.secret,
      encoding: 'base32',
      token: dto.code,
      window: 1,
    });
    if (!valid) throw new BadRequestException('Invalid authenticator code');

    const permissions = await this.getUserPermissions(user.roleId);
    return { token: this.signToken(user.id, user.email), permissions };
  }

  async forgotPassword(dto: ForgetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    // Always return success to prevent email enumeration
    if (!user)
      return {
        message: 'If that email exists, an OTP was sent',
        success: true,
      };

    const code = this.generateNumericOTP(6);
    const codeExpires = new Date(Date.now() + OTP_TTL_MS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { code, reset_password_expires: codeExpires },
    });

    await this.email.sendForgotPassword(user.email, user.name, code);
    return { message: 'If that email exists, an OTP was sent', success: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('User not found');

    if (
      user.code !== dto.code ||
      !user.reset_password_expires ||
      user.reset_password_expires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        code: null,
        reset_password_expires: null,
      },
    });

    return { message: 'Password reset successfully', success: true };
  }

  async changePassword(id: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const isPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isPasswordValid) throw new BadRequestException('Invalid old password');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully', success: true };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, organization: true },
    });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  private async getUserPermissions(roleId: number): Promise<string[]> {
    const userPermissions = await this.prisma.permission.findMany({
      where: { roleId },
      select: { action: true, resource: { select: { slug: true } } },
    });
    return [
      ...new Set(userPermissions.map((p) => `${p.resource.slug}:${p.action}`)),
    ];
  }

  private signToken(userId: number, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }

  private sanitize(user: Record<string, unknown>) {
    const { password, code, secret, ...rest } = user;
    void password;
    void code;
    void secret;
    return rest;
  }

  private generateNumericOTP(length: number): string {
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
  }
}
