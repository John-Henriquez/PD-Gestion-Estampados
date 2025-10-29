import React, { useState, useCallback, useEffect } from 'react';
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { UploadCloud as UploadIcon, CheckCircle, XCircle } from 'lucide-react';
import { uploadStampImage } from '../services/upload.service';
import { showErrorAlert } from '../helpers/sweetAlert';

const uploaderStyles = {
  border: '2px dashed var(--gray-300)',
  borderRadius: 'var(--border-radius-md)',
  padding: 'var(--spacing-md)',
  textAlign: 'center',
  cursor: 'pointer',
  marginBottom: 'var(--spacing-sm)',
  backgroundColor: 'var(--gray-100)',
  transition: 'background-color var(--transition-fast)',
  '&:hover': {
    backgroundColor: 'var(--gray-200)',
    borderColor: 'var(--primary-light)',
  },
};

const previewStyles = {
  maxWidth: '100%',
  maxHeight: '150px',
  marginTop: 'var(--spacing-sm)',
  borderRadius: 'var(--border-radius-sm)',
  border: '1px solid var(--gray-300)',
};

const statusIconStyles = {
  verticalAlign: 'middle',
  marginLeft: 'var(--spacing-xs)',
};

const ImageUploader = ({ onUploadSuccess, initialImageUrl = null }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(initialImageUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (initialImageUrl) {
      const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
      setPreviewUrl(`${backendUrl.replace('/api', '')}${initialImageUrl}`);
      setUploadedUrl(initialImageUrl);
      setSelectedFile(null);
    } else {
      setPreviewUrl(null);
      setUploadedUrl(null);
    }
  }, [initialImageUrl]);

  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecciona un archivo de imagen válido.');
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploadedUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setSelectedFile(file);
      setError(null);
      setUploadedUrl(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const imageUrl = await uploadStampImage(selectedFile);
      setUploading(false);
      setUploadedUrl(imageUrl);
      onUploadSuccess(imageUrl);
      const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
      setPreviewUrl(`${backendUrl.replace('/api', '')}${imageUrl}`);
    } catch (err) {
      setUploading(false);
      const errorMessage = err.message || err.details || 'Error al subir la imagen.';
      setError(errorMessage);
      showErrorAlert('Error de Subida', errorMessage);
      setUploadedUrl(null);
    }
  }, [selectedFile, onUploadSuccess]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      <input
        type="file"
        ref={fileInputRef}
        id="stamp-image-input"
        accept="image/jpeg, image/png, image/gif, image/webp, image/svg+xml"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Zona de Carga */}
      <Box
        sx={uploaderStyles}
        onClick={triggerFileInput}
        role="button"
        tabIndex={0}
        aria-label="Seleccionar imagen para estampar"
      >
        <UploadIcon
          size={48}
          color="var(--gray-700)"
          style={{ marginBottom: 'var(--spacing-xs)' }}
        />
        <Typography variant="body1" color="var(--gray-900)">
          {selectedFile
            ? `Archivo: ${selectedFile.name}`
            : uploadedUrl
              ? 'Imagen Cargada'
              : 'Selecciona o arrastra tu imagen'}
        </Typography>
        <Typography variant="caption" color="var(--gray-700)">
          (JPG, PNG, GIF, WEBP, SVG - Máx 10MB)
        </Typography>
        {/* Indicador de Estado */}
        {uploading && (
          <CircularProgress
            size={20}
            sx={{ display: 'block', margin: 'var(--spacing-xs) auto 0' }}
          />
        )}
        {!uploading && uploadedUrl && (
          <CheckCircle size={20} color="var(--success)" style={statusIconStyles} />
        )}
        {!uploading && error && <XCircle size={20} color="var(--error)" style={statusIconStyles} />}
      </Box>

      {/* Previsualización */}
      {previewUrl && (
        <Box textAlign="center" mb={1}>
          <Typography variant="caption" color="textSecondary">
            Previsualización:
          </Typography>
          <img src={previewUrl} alt="Previsualización de estampado" style={previewStyles} />
        </Box>
      )}

      {/* Botón de Subida (solo si hay archivo seleccionado Y no ha sido subido aún) */}
      {selectedFile && !uploadedUrl && !uploading && (
        <Button
          variant="contained"
          // Usando tus variables de color
          sx={{
            backgroundColor: 'var(--secondary)',
            color: 'white',
            mt: 1,
            display: 'block',
            margin: 'auto',
            '&:hover': { backgroundColor: 'var(--secondary-dark)' },
          }}
          onClick={handleUpload}
          disabled={uploading}
          startIcon={<UploadIcon size={20} />}
        >
          Confirmar Subida
        </Button>
      )}

      {/* Mensaje de Error (si no es durante la subida) */}
      {error && !uploading && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default ImageUploader;
