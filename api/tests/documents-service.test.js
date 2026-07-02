import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addNewDocument,
  getAlldocuments,
  getDocumentById,
  deleteDocumentById,
} from "../src/documents/documents.service.js";

// Mock the repository module
vi.mock("../src/documents/documents.repository.js", () => ({
  default: {
    addNewDocument: vi.fn(),
    getAllDocuments: vi.fn(),
    getDocumentById: vi.fn(),
    deleteDocumentById: vi.fn(),
  },
}));

// Mock i18next
vi.mock("i18next", () => ({
  default: {
    t: (key) => key,
  },
}));

import documentsRepository from "../src/documents/documents.repository.js";

describe("Documents Service", () => {
  const mockUser = { id: "user-abc123", role: "jobseeker" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addNewDocument", () => {
    it("should create a new document successfully", async () => {
      const file = {
        path: "/uploads/document.pdf",
        filename: "document-123.pdf",
        originalname: "resume.pdf",
        size: 1024 * 1024, // 1MB
        mimetype: "application/pdf",
      };

      documentsRepository.addNewDocument.mockResolvedValue("doc-abc123");

      const result = await addNewDocument(file, mockUser);

      expect(result).toEqual({
        documentId: "doc-abc123",
        filename: "document-123.pdf",
        originalName: "resume.pdf",
        size: 1024 * 1024,
      });
      expect(documentsRepository.addNewDocument).toHaveBeenCalledWith({
        file_url: file.path,
        user_id: mockUser.id,
      });
    });

    it("should throw AuthError if user is not authenticated", async () => {
      const file = {
        path: "/uploads/document.pdf",
        filename: "document-123.pdf",
        originalname: "resume.pdf",
        size: 1024 * 1024,
        mimetype: "application/pdf",
      };

      await expect(addNewDocument(file, null)).rejects.toThrow();
    });

    it("should throw NotFoundError if file is null", async () => {
      await expect(addNewDocument(null, mockUser)).rejects.toThrow();
    });

    it("should throw UnsupportedMediaError if file is too large", async () => {
      const file = {
        path: "/uploads/document.pdf",
        filename: "document-123.pdf",
        originalname: "resume.pdf",
        size: 6 * 1024 * 1024, // 6MB - exceeds 5MB limit
        mimetype: "application/pdf",
      };

      await expect(addNewDocument(file, mockUser)).rejects.toThrow();
    });

    it("should throw UnsupportedMediaError if file is not a PDF", async () => {
      const file = {
        path: "/uploads/document.txt",
        filename: "document-123.txt",
        originalname: "resume.txt",
        size: 1024 * 1024,
        mimetype: "text/plain",
      };

      await expect(addNewDocument(file, mockUser)).rejects.toThrow();
    });
  });

  describe("getAlldocuments", () => {
    it("should return all documents", async () => {
      const mockDocuments = [
        { id: "doc-1" },
        { id: "doc-2" },
        { id: "doc-3" },
      ];

      documentsRepository.getAllDocuments.mockResolvedValue(mockDocuments);

      const result = await getAlldocuments(mockUser);

      expect(result).toEqual(mockDocuments);
      expect(documentsRepository.getAllDocuments).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe("getDocumentById", () => {
    it("should return document by id", async () => {
      const mockDocument = {
        id: "doc-abc123",
        file_url: "/uploads/document.pdf",
      };

      documentsRepository.getDocumentById.mockResolvedValue(mockDocument);

      const result = await getDocumentById("doc-abc123", mockUser);

      expect(result).toEqual(mockDocument);
      expect(documentsRepository.getDocumentById).toHaveBeenCalledWith("doc-abc123", mockUser.id);
    });

    it("should throw NotFoundError if document not found", async () => {
      documentsRepository.getDocumentById.mockResolvedValue(null);

      await expect(getDocumentById("nonexistent")).rejects.toThrow();
    });
  });

  describe("deleteDocumentById", () => {
    it("should delete a document successfully", async () => {
      documentsRepository.deleteDocumentById.mockResolvedValue("doc-abc123");

      const result = await deleteDocumentById("doc-abc123", mockUser);

      expect(result).toBe("doc-abc123");
      expect(documentsRepository.deleteDocumentById).toHaveBeenCalledWith("doc-abc123", mockUser.id);
    });

    it("should throw AuthError if user is null", async () => {
      await expect(deleteDocumentById("doc-1", null)).rejects.toThrow();
    });
  });
});
