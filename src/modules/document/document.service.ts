/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentResponseDto,
} from './dto/document.dto';

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  createDocument(
    _createDocumentDto: CreateDocumentDto,
  ): Promise<DocumentResponseDto> {
    // Implementation will be added later
    throw new NotImplementedException('Document creation not implemented yet');
  }

  getAllDocuments(): Promise<DocumentResponseDto[]> {
    // Implementation will be added later
    throw new NotImplementedException('Get all documents not implemented yet');
  }

  getDocumentById(_id: string): Promise<DocumentResponseDto> {
    // Implementation will be added later
    throw new NotImplementedException('Get document by ID not implemented yet');
  }

  updateDocument(
    _id: string,
    _updateDocumentDto: UpdateDocumentDto,
  ): Promise<DocumentResponseDto> {
    // Implementation will be added later
    throw new NotImplementedException('Document update not implemented yet');
  }

  deleteDocument(_id: string): Promise<{ message: string }> {
    // Implementation will be added later
    throw new NotImplementedException('Document deletion not implemented yet');
  }
}
