/**
 * Vercel Blob Provider implementation.
 * Note: To use real Vercel Blob, you would install @vercel/blob.
 * For now, this is a mock implementation that can be swapped later.
 */

export const provider = {
  uploadFile: async (file, options) => {
    console.log(`[VercelBlob Provider] Mock uploading file: ${file?.name}`);
    return {
      url: `https://mock-blob-storage.vercel.app/${file?.name || 'uploaded-file'}`,
      provider: 'vercel-blob',
      key: `mock-key/${file?.name}`
    };
  },

  deleteFile: async (url) => {
    console.log(`[VercelBlob Provider] Mock deleting file: ${url}`);
    return true;
  },

  getFileUrl: async (key) => {
    return `https://mock-blob-storage.vercel.app/${key}`;
  },

  replaceFile: async (oldUrl, newFile, options) => {
    console.log(`[VercelBlob Provider] Mock replacing ${oldUrl} with ${newFile?.name}`);
    return {
      url: `https://mock-blob-storage.vercel.app/${newFile?.name || 'replaced-file'}`,
      provider: 'vercel-blob',
      key: `mock-key/${newFile?.name}`
    };
  },

  uploadMultipleFiles: async (files, options) => {
    const results = [];
    for (const file of files) {
      results.push(await provider.uploadFile(file, options));
    }
    return results;
  }
};
