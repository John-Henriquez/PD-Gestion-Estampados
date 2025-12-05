import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
} from '@mui/material';
import { Delete, Edit, Download } from '@mui/icons-material';
import { getGallery, deleteFile, renameFile, downloadOrderZip } from '../services/upload.service';
import { showSuccessAlert, deleteDataAlert, showErrorAlert } from '../helpers/sweetAlert';

const Gallery = () => {
  const [files, setFiles] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [renameModal, setRenameModal] = useState({
    open: false,
    originalName: '',
    namePart: '',
    extension: '',
  });

  const apiUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
  const backendUrl = apiUrl.replace('/api', '');

  const fetchFiles = async () => {
    try {
      const data = await getGallery();
      setFiles(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const openRenameDialog = (filename) => {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      setRenameModal({ open: true, originalName: filename, namePart: filename, extension: '' });
    } else {
      const namePart = filename.substring(0, lastDotIndex);
      const extension = filename.substring(lastDotIndex);
      setRenameModal({ open: true, originalName: filename, namePart, extension });
    }
  };

  const handleDelete = async (filename) => {
    const result = await deleteDataAlert(
      '¿Eliminar archivo?',
      'Esta acción es irreversible y podría romper imágenes en productos o pedidos.'
    );
    if (result.isConfirmed) {
      try {
        await deleteFile(filename);
        showSuccessAlert('Eliminado', 'Archivo eliminado correctamente');
        fetchFiles();
      } catch {
        showErrorAlert('Error', 'No se pudo eliminar');
      }
    }
  };

  const handleRename = async () => {
    if (!renameModal.namePart.trim()) {
      showErrorAlert('Error', 'El nombre no puede estar vacío');
      return;
    }

    const newFullName = `${renameModal.namePart}${renameModal.extension}`;

    try {
      await renameFile(renameModal.originalName, newFullName);
      setRenameModal({ ...renameModal, open: false });
      showSuccessAlert('Renombrado', 'Archivo actualizado correctamente.');
      fetchFiles();
    } catch (err) {
      const msg = err.response?.data?.message || 'No se pudo renombrar';
      showErrorAlert('Error', msg);
    }
  };
  const filteredFiles = files.filter((f) => {
    if (tabValue === 0) return true;
    if (tabValue === 1) return f.category === 'inventory';
    if (tabValue === 2) return f.category === 'order';
    if (tabValue === 3) return f.category === 'uncategorized';
    return true;
  });

  return (
    <Box sx={{ p: 3, pt: 10 }}>
      <Typography variant="h4" gutterBottom>
        Galería de Imágenes
      </Typography>

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Todos" />
        <Tab label="Inventario" />
        <Tab label="Pedidos" />
        <Tab label="Sin Categoría" />
      </Tabs>

      <Grid container spacing={2}>
        {filteredFiles.map((file) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={file.filename}>
            <Paper sx={{ p: 1, position: 'relative' }}>
              <Box
                component="img"
                src={`${backendUrl}${file.url}`}
                //src={`${(import.meta.env.VITE_BASE_URL || '').replace('/api', '')}${file?.url || ''}`}
                sx={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 1 }}
              />
              <Typography variant="caption" display="block" noWrap>
                {file.filename}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {(file.size / 1024).toFixed(2)} KB
              </Typography>

              {file.category === 'order' && file.relatedId && (
                <Typography variant="caption" display="block" color="primary">
                  Pedido #{file.relatedId}
                </Typography>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <IconButton size="small" onClick={() => openRenameDialog(file.filename)}>
                  <Edit fontSize="small" />
                </IconButton>

                {/* Botón de descarga ZIP si es de pedido */}
                {file.category === 'order' && file.relatedId && (
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => downloadOrderZip(file.relatedId)}
                    title="Descargar todas las imgs de este pedido"
                  >
                    <Download fontSize="small" />
                  </IconButton>
                )}

                <IconButton size="small" color="error" onClick={() => handleDelete(file.filename)}>
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={renameModal.open}
        onClose={() => setRenameModal({ ...renameModal, open: false })}
      >
        <DialogTitle>Renombrar Archivo</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nuevo nombre"
            value={renameModal.namePart || ''}
            onChange={(e) => setRenameModal({ ...renameModal, namePart: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameModal({ ...renameModal, open: false })}>Cancelar</Button>
          <Button onClick={handleRename} variant="contained">
            Renombrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Gallery;
