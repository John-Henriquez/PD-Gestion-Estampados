// src/components/Inventory/PacksSection.jsx
import { useState, useContext } from 'react';
import { Box, Button, Paper, Typography, Grid, Chip, CircularProgress, Alert } from '@mui/material';
import { Add as AddIcon, DeleteSweep as DeleteSweepIcon, Edit as EditIcon, DeleteOutline as DeleteIcon } from '@mui/icons-material'; 

import PackModal from '../PackModal.jsx'; 
import PackTrashModal from '../PackTrashModal.jsx'; 
import { AuthContext } from '../../context/AuthContext.jsx'; 
import { deleteDataAlert, showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert'; 

// Hooks de Pack
import usePack from '../../hooks/pack/usePack.jsx';
import useDeletePack from '../../hooks/pack/useDeletePack.jsx'; 
import useDeletedPacks from '../../hooks/pack/useDeletedPacks.jsx'; 
import useRestorePack from '../../hooks/pack/useRestorePack.jsx'; 

import '../../styles/components/packsSection.css'; 

const PacksSection = ({ itemStock, refetchStock }) => { 
    const { user } = useContext(AuthContext);

    // Estado y Hooks para Packs
    const [openPackModal, setOpenPackModal] = useState(false);
    const [openPackTrash, setOpenPackTrash] = useState(false);
    const [editingPack, setEditingPack] = useState(null);

    const { packs, loading: packsLoading, error: packsError, refetch: refetchPacks } = usePack();
    const { remove: deletePackHook, loading: deletingPack } = useDeletePack();
    const { deletedPacks, refetch: fetchDeletedPacks } = useDeletedPacks();
    const { restore: restorePackHook } = useRestorePack();

    const handleOpenPackModal = (packToEdit = null) => {
        setEditingPack(packToEdit);
        setOpenPackModal(true);
    };

    const handleOpenPackTrash = async () => {
        try {
            await fetchDeletedPacks();
            setOpenPackTrash(true);
        } catch (err) {
            showErrorAlert('Error', 'No se pudieron cargar los packs eliminados.');
            console.error('[PacksSection] Error fetching deleted packs:', err);
        }
    };

     const handleDelete = async (id) => {
        const result = await deleteDataAlert(
             '¿Desactivar este pack?',
             'Podrás restaurarlo desde la papelera.'
            );
        if (!result.isConfirmed) return;

        const [res, err] = await deletePackHook(id);
        if (res && res.status === "Success") {
            showSuccessAlert("Desactivado", res.message || "Pack enviado a la papelera");
            await refetchPacks(); 
        } else {
            const message = err?.message || 'Error al desactivar el pack.';
            showErrorAlert("Error", message);
            console.error('[PacksSection] Error deleting pack:', err);
        }
    };

     const handleRestore = async (id) => {
        try {
            await restorePackHook(id);
            showSuccessAlert('Restaurado', 'El pack fue restaurado correctamente');
            await Promise.all([
                refetchPacks(),
                fetchDeletedPacks(), 
            ]);
            setOpenPackTrash(false);
        } catch (error) {
            showErrorAlert('Error al restaurar', error?.message || 'Ocurrió un error.');
        }
    };

    const handlePackModalCompleted = async () => {
        setOpenPackModal(false);
        setEditingPack(null);
        await refetchPacks(); 
        if (refetchStock) {
           await refetchStock(); 
        }
    };

    return (
        <Paper className="inventory-paper"> 
            <Box className="packs-section-header"> 
                 <Typography variant="h5">Packs ({packs.length})</Typography>
                 <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="contained"
                        color="success" 
                        startIcon={<AddIcon />}
                        className="inventory-button" 
                        onClick={() => handleOpenPackModal()}
                    >
                        Nuevo Pack
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<DeleteSweepIcon />}
                        className="inventory-button inventory-button--outlined" 
                        onClick={handleOpenPackTrash}
                    >
                        Papelera Packs
                    </Button>
                </Box>
            </Box>

            {packsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : packsError ? (
                 <Alert severity="error">Error al cargar packs: {packsError.message || packsError}</Alert>
            ): packs.length > 0 ? (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {packs.map((pack) => (
                        <Grid item xs={12} sm={6} md={4} key={pack.id}>
                            <Paper className="pack-card" variant="outlined"> 
                                <Box className="pack-card-header"> 
                                    <Typography variant="h6" className="pack-card-title">{pack.name}</Typography> 
                                    <Chip
                                        label={pack.isActive ? "Activo" : "Inactivo"}
                                        color={pack.isActive ? "success" : "default"}
                                        size="small"
                                    />
                                </Box>
                                <Box className="pack-card-content"> 
                                    <Typography variant="body1" fontWeight="bold" className="pack-card-price">
                                        ${pack.price?.toLocaleString()}
                                    </Typography>
                                    {pack.discount > 0 && (
                                        <Typography variant="body2" color="var(--success-dark)" className="pack-card-discount">
                                            {Math.round(pack.discount * 100)}% Dcto.
                                        </Typography>
                                    )}
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                                        {pack.description || 'Sin descripción'}
                                    </Typography>

                                    {/* Items del pack */}
                                    <Box sx={{ mt: 1.5 }}>
                                        <Typography variant="caption" color="textSecondary">Contiene:</Typography>
                                        <ul className="pack-card-items-list"> 
                                            {pack.packItems?.slice(0, 3).map((packItem, index) => ( 
                                                <li key={index}>
                                                   {packItem.itemStock?.itemType?.name || 'Item'} ({packItem.quantity}x)
                                                   {packItem.itemStock?.size ? ` - ${packItem.itemStock.size}` : ''}
                                                    <Box component="span"
                                                         className="pack-card-item-color" 
                                                         sx={{ backgroundColor: packItem.itemStock?.hexColor || '#ccc' }}
                                                         title={packItem.itemStock?.hexColor}
                                                    />
                                                </li>
                                            ))}
                                             {pack.packItems?.length > 3 && <li>...y más</li>}
                                        </ul>
                                    </Box>
                                </Box>
                                <Box className="pack-card-actions"> 
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<EditIcon fontSize="small"/>}
                                        onClick={() => handleOpenPackModal(pack)}
                                        className="inventory-button inventory-button--outlined inventory-button--small" 
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                        startIcon={<DeleteIcon fontSize="small"/>}
                                        onClick={() => handleDelete(pack.id)}
                                        disabled={deletingPack}
                                        className="inventory-button inventory-button--error inventory-button--small" 
                                    >
                                        Desactivar
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
                    No hay packs activos definidos.
                </Typography>
            )}

             {/* Modales de Pack */}
             <PackModal
                 open={openPackModal}
                 onClose={() => { setOpenPackModal(false); setEditingPack(null); }}
                 onCompleted={handlePackModalCompleted} 
                 editingPack={editingPack}
                 currentUserRut={user?.rut}
                 itemStock={itemStock} 
                 refetchStocks={refetchStock} 
             />
             <PackTrashModal
                 open={openPackTrash}
                 onClose={() => setOpenPackTrash(false)}
                 deletedPacks={deletedPacks || []} 
                 onRestore={handleRestore} 
                 onRefresh={async () => { 
                    await refetchPacks();
                    await fetchDeletedPacks();
                 }}
             />
        </Paper>
    );
};

export default PacksSection;