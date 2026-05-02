import { IsEmail, IsString, MinLength, IsNotEmpty, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
