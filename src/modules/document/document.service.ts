import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentResponseDto,
} from './dto/document.dto';

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  private toResponseDto(document: any): DocumentResponseDto {
    return {
      id: document.id,
      title: document.title,
      content: document.content,
      // description is not stored in the DB schema; keep undefined for compatibility
      description: undefined,
      docCreatorEmail: document.docCreatorEmail,
      docCreatorId: document.docCreatorId,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  async createDocument(
    createDocumentDto: CreateDocumentDto,
  ): Promise<DocumentResponseDto> {
    try {
      const document = await this.prisma.document.create({
        data: {
          title: createDocumentDto.title,
          content: createDocumentDto.content ?? '',
          docCreatorEmail: createDocumentDto.docCreatorEmail,
          docCreatorId: createDocumentDto.docCreatorId,
        },
      });

      return this.toResponseDto(document);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating document:', error);
      throw new InternalServerErrorException('Failed to create document');
    }
  }

  async getAllDocuments(email?: string): Promise<DocumentResponseDto[]> {
    try {
      const where = email ? { docCreatorEmail: email } : undefined;

      const documents = await this.prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return documents.map((doc) => this.toResponseDto(doc));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching documents:', error);
      throw new InternalServerErrorException('Failed to fetch documents');
    }
  }

  async getDocumentById(id: string): Promise<DocumentResponseDto> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id },
      });

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      return this.toResponseDto(document);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // eslint-disable-next-line no-console
      console.error('Error fetching document by ID:', error);
      throw new InternalServerErrorException('Failed to fetch document');
    }
  }

  async updateDocument(
    id: string,
    updateDocumentDto: UpdateDocumentDto,
  ): Promise<DocumentResponseDto> {
    try {
      // Only title and content are updatable, to match old behavior
      const data: any = {};
      if (updateDocumentDto.title !== undefined) {
        data.title = updateDocumentDto.title;
      }
      if (updateDocumentDto.content !== undefined) {
        data.content = updateDocumentDto.content;
      }

      let document;
      try {
        document = await this.prisma.document.update({
          where: { id },
          data,
        });
      } catch {
        throw new NotFoundException('Document not found');
      }

      return this.toResponseDto(document);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // eslint-disable-next-line no-console
      console.error('Error updating document:', error);
      throw new InternalServerErrorException('Failed to update document');
    }
  }

  async deleteDocument(id: string): Promise<{ message: string }> {
    try {
      const document = await this.prisma.document.findUnique({ where: { id } });

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      await this.prisma.document.delete({ where: { id } });

      return { message: 'Document deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // eslint-disable-next-line no-console
      console.error('Error deleting document:', error);
      throw new InternalServerErrorException('Failed to delete document');
    }
  }
}
