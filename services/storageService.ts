import { supabase } from './supabaseClient';

const BUCKET_NAME = 'project-documents';

export interface ProjectDocument {
    id: string;
    projectId: string;
    fileName: string;
    filePath: string;
    fileUrl: string;
    fileSize: number;
    uploadedBy?: string;
    uploadedAt?: string;
}

export const storageService = {
    /**
     * Upload a file to Supabase Storage and return the public URL
     */
    async uploadFile(projectId: string, file: File, uploadedBy?: string): Promise<ProjectDocument> {
        const fileExt = file.name.split('.').pop();
        const fileName = file.name;
        const filePath = `${projectId}/${Date.now()}_${fileName}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        const fileUrl = urlData.publicUrl;

        // Create database record
        const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { data: dbData, error: dbError } = await supabase
            .from('project_documents')
            .insert({
                id: documentId,
                project_id: projectId,
                file_name: fileName,
                file_path: filePath,
                file_url: fileUrl,
                file_size: file.size,
                uploaded_by: uploadedBy
            })
            .select()
            .single();

        if (dbError) {
            // Rollback: delete the uploaded file
            await supabase.storage.from(BUCKET_NAME).remove([filePath]);
            throw new Error(`Failed to save document record: ${dbError.message}`);
        }

        return {
            id: dbData.id,
            projectId: dbData.project_id,
            fileName: dbData.file_name,
            filePath: dbData.file_path,
            fileUrl: dbData.file_url,
            fileSize: dbData.file_size,
            uploadedBy: dbData.uploaded_by,
            uploadedAt: dbData.uploaded_at
        };
    },

    /**
     * Delete a file from both storage and database
     */
    async deleteFile(documentId: string): Promise<void> {
        // Get file path from database
        const { data: doc, error: fetchError } = await supabase
            .from('project_documents')
            .select('file_path')
            .eq('id', documentId)
            .single();

        if (fetchError) throw fetchError;

        // Delete from storage
        const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([doc.file_path]);

        if (storageError) {
            console.error('Storage deletion error:', storageError);
        }

        // Delete from database
        const { error: dbError } = await supabase
            .from('project_documents')
            .delete()
            .eq('id', documentId);

        if (dbError) throw dbError;
    },

    /**
     * Get all documents for a project
     */
    async getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
        const { data, error } = await supabase
            .from('project_documents')
            .select('*')
            .eq('project_id', projectId)
            .order('uploaded_at', { ascending: false });

        if (error) throw error;

        return data ? data.map(doc => ({
            id: doc.id,
            projectId: doc.project_id,
            fileName: doc.file_name,
            filePath: doc.file_path,
            fileUrl: doc.file_url,
            fileSize: doc.file_size,
            uploadedBy: doc.uploaded_by,
            uploadedAt: doc.uploaded_at
        })) : [];
    },

    /**
     * Download and read file content from storage
     */
    async getFileContent(filePath: string): Promise<string> {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .download(filePath);

        if (error) throw error;

        // Convert blob to text
        const text = await data.text();
        return text;
    },

    /**
     * Get file content for AI processing (batch)
     */
    async getProjectFileContents(projectId: string): Promise<{ name: string; content: string }[]> {
        const documents = await this.getProjectDocuments(projectId);

        const contents = await Promise.all(
            documents.map(async (doc) => {
                try {
                    const content = await this.getFileContent(doc.filePath);
                    return { name: doc.fileName, content };
                } catch (error) {
                    console.error(`Failed to read ${doc.fileName}:`, error);
                    return { name: doc.fileName, content: `[Error reading file: ${doc.fileName}]` };
                }
            })
        );

        return contents;
    }
};
