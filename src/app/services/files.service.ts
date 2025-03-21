import { API_ENDPOINTS } from '../lib/api/config';
import { toast } from 'react-toastify';

export const uploadImage = async (imageFile: File): Promise<string> => {
  // const token = JSON.parse(localStorage.getItem('accessToken'));
  // if (!token) {
  //   throw new Error('User not authenticated');
  // }
  //console.log('Uploading image with token:', localStorage.getItem('accessToken'));

  // const formData = new FormData();
  // formData.append('file', imageFile);

 // console.log('Uploading image with token:', token);
  console.log('Image file:', imageFile);

  const response = { ok: true, url: 'https://res.cloudinary.com/iknowsaint/image/upload/v1741563890/images/xglmcp793rhnbjgn1gnz.jpg' };
  // const response = await fetch(`${API_ENDPOINTS.UPLOAD_IMAGE}`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: formData,
  // });

  console.log('Response status:', response.ok);
  const responseText = response.url;
  console.log('Response text:', responseText);

  if (!response.ok) {
    toast.error('Failed to upload image');
    throw new Error('Failed to upload image');
  }

  toast.success('Image uploaded successfully!'); // Use toast for success
  return response.url;
};
