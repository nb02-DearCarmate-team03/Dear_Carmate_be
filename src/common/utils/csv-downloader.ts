import axios from 'axios';

/**
 * 주어진 S3 또는 외부 URL로부터 CSV 파일을 다운로드합니다.
 * @param fileUrl CSV 파일의 URL
 * @returns 파일 내용을 담은 Buffer
 */
export const downloadCsvFile = async (fileUrl: string): Promise<Buffer> => {
  try {
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
  } catch (error) {
    console.error('CSV 파일 다운로드 중 오류 발생:', error);
    throw new Error('CSV 파일을 다운로드할 수 없습니다.');
  }
};
