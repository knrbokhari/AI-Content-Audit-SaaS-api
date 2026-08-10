import { IsEmpty, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsEmpty()
  description!: string;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsString()
  @IsEmpty()
  currency!: string;

  @IsString()
  @IsNotEmpty()
  interval: 'day' | 'week' | 'month' | 'year' = 'month';

  @IsString({ each: true })
  @IsEmpty()
  features: Array<string> = [];
}
