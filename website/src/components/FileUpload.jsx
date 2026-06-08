import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';
import { API_URL } from '../config';

const DropzoneContainer = styled.div`
  border: 2px dashed ${({ $isDragActive, $hasFile }) =>
    $isDragActive ? '#007bff' : $hasFile ? '#4caf50' : '#ccc'};
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  background-color: ${({ $isDragActive }) =>
    $isDragActive ? 'rgba(0, 123, 255, 0.05)' : 'transparent'};
  transition: border-color 0.2s ease;
  margin-bottom: 20px;

  &:hover {
    border-color: ${({ $hasFile }) => ($hasFile ? '#4caf50' : '#007bff')};
  }
`;

const RemoveButton = styled.button`
  margin-left: 10px;
  border: 1px solid #cbd8cb;
  border-radius: 6px;
  min-height: 30px;
  padding: 0 10px;
  background: #ffffff;
  cursor: pointer;
`;

const handleUpload = async (file, businessId, ownerToken, onUploadComplete) => {
  if (!file) {
    console.error('No file selected.');
    return;
  }
  if (!businessId) {
    console.error('Create or select a business first.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_URL}/businesses/${businessId}/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    onUploadComplete?.(result);
  } catch (error) {
    console.error('Upload Error:', error);
  }
};

const FileUpload = ({ onFileUpload, currentFile, businessId, ownerToken, onUploadComplete }) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        onFileUpload(file);
        handleUpload(file, businessId, ownerToken, onUploadComplete);
      }
    },
    [businessId, onFileUpload, onUploadComplete, ownerToken],
  );

  const removeFile = useCallback(
    (event) => {
      event.stopPropagation();
      onFileUpload(null);
    },
    [onFileUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop,
    disabled: !!currentFile || !businessId || !ownerToken,
  });

  return (
    <DropzoneContainer
      {...getRootProps()}
      $isDragActive={isDragActive}
      $hasFile={!!currentFile}
    >
      <input {...getInputProps()} />
      {currentFile ? (
        <div>
          <span>PDF {currentFile.name}</span>
          <RemoveButton type="button" onClick={removeFile}>
            Remove
          </RemoveButton>
        </div>
      ) : (
        <p>
          {isDragActive
            ? 'Drop the PDF here...'
            : businessId && ownerToken
              ? "Drag 'n' drop a PDF here, or click to select"
              : 'Create a business first, then upload a PDF'}
        </p>
      )}
    </DropzoneContainer>
  );
};

export default FileUpload;
