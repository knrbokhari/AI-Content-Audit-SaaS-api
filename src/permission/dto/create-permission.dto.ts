import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsNumber()
  @IsNotEmpty()
  roleId!: number;

  @IsNumber()
  @IsNotEmpty()
  resourceId!: number;

  @IsString()
  @IsNotEmpty()
  action!: any;
}
