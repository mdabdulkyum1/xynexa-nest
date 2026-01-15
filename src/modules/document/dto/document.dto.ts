import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEmail()
  @IsNotEmpty()
  docCreatorEmail!: string;

  @IsMongoId()
  @IsNotEmpty()
  docCreatorId!: string;
}

export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class DocumentResponseDto {
  id!: string;
  title!: string;
  content?: string;
  description?: string;
  docCreatorEmail!: string;
  docCreatorId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
