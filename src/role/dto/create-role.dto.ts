import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsBoolean()
  @IsNotEmpty()
  isSystem!: boolean;
}
