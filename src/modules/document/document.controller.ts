import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentResponseDto,
} from './dto/document.dto';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDocument(
    @Body() createDocumentDto: CreateDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentService.createDocument(createDocumentDto);
  }

  @Get()
  async getAllDocuments(
    @Query('email') email?: string,
  ): Promise<DocumentResponseDto[]> {
    return this.documentService.getAllDocuments(email);
  }

  @Get(':id')
  async getDocument(@Param('id') id: string): Promise<DocumentResponseDto> {
    return this.documentService.getDocumentById(id);
  }

  @Put(':id')
  async updateDocument(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentService.updateDocument(id, updateDocumentDto);
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: string): Promise<{ message: string }> {
    return this.documentService.deleteDocument(id);
  }
}
