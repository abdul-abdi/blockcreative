import axios from 'axios';

/**
 * Uploads a file buffer to IPFS using a public IPFS API (e.g., Infura or Pinata)
 * @param fileBuffer - The file data as a Buffer
 * @param fileName - The name of the file
 * @returns The IPFS hash (CID) of the uploaded file
 */
export async function uploadFileToIPFS(fileBuffer: Buffer, fileName: string): Promise<string> {
  try {
    // Use Infura IPFS API endpoint as example
    const url = 'https://ipfs.infura.io:5001/api/v0/add';

    // Create form data
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), fileName);

    // Post to IPFS API
    const response = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data && response.data.Hash) {
      return response.data.Hash;
    } else {
      throw new Error('Invalid response from IPFS API');
    }
  } catch (error) {
    console.error('Failed to upload file to IPFS:', error);
    throw error;
  }
}
