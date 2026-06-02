import { IsEmail, IsNotEmpty, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateInvitationDto {
  @IsEmail({}, { message: 'Por favor ingrese un correo válido' })
  @IsNotEmpty()
  email: string;

  @IsEnum(Role, { message: 'El rol especificado no es válido' })
  @IsNotEmpty()
  role: Role;
}
