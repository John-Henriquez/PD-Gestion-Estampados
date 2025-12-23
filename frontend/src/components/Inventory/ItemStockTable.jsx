import React from 'react';
import { Box, Chip, Typography, Paper, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import { 
    Edit as EditIcon, 
    DeleteOutline as DeleteIcon,
    Inventory2 as StockIcon 
} from '@mui/icons-material';
import { iconMap } from '../../data/iconCategories';
import '../../styles/components/itemStockTable.css';


const ItemStockTable = ({ stockItems = [], onEdit, onDelete, loading = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const rows = stockItems.map((item) => ({
    id: item.id,
    itemTypeName: item.itemType?.name || 'Desconocido',
    itemTypeIconName: item.itemType?.iconName,
    colorName: item.color?.name || 'Desconocido',
    hexColor: item.color?.hex || '#FFFFFF',
    size: item.size,
    quantity: item.quantity,
    minStock: item.minStock,
    _original: item,
  }));

  const columns = [
    {
      field: 'itemTypeName',
      headerName: 'Tipo',
      minWidth: 200,
      flex: 2,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
          {params.row.itemTypeIconName && iconMap[params.row.itemTypeIconName] && 
            React.createElement(iconMap[params.row.itemTypeIconName], { 
                size: 20, 
                color: theme.palette.primary.main 
            })
          }
          <Typography variant="body2" fontWeight="500" noWrap>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'colorName',
      headerName: 'Variante',
      minWidth: 150,
      flex: 1.5,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box className="color-dot" sx={{ backgroundColor: params.row.hexColor }} />
          <Typography variant="body2">{params.value}</Typography>
          {params.row.size && <Chip label={params.row.size} size="small" variant="outlined" sx={{ ml: 1, height: 20 }} />}
        </Box>
      ),
    },
    {
      field: 'quantity',
      headerName: 'Stock (Min)',
      type: 'number',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      cellClassName: (params) => {
        if (params.value <= params.row.minStock) return 'stock-cell-low';
        if (params.value <= params.row.minStock * 1.2) return 'stock-cell-warning';
        return '';
      },
      renderCell: (params) => (
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" fontWeight="bold">{params.value}</Typography>
          <Typography variant="caption" color="textSecondary">Mín: {params.row.minStock}</Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Acciones',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Editar"
          onClick={() => onEdit(params.row._original)}
          color="primary"
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Desactivar"
          onClick={() => onDelete(params.id)}
          color="error"
        />,
      ],
    },
  ];

  if (isMobile) {
    return (
      <Box className="stock-mobile-grid">
        {rows.map((row) => (
          <Paper key={row.id} className="stock-mobile-card" elevation={0}>
            <div className="card-header">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {row.itemTypeIconName && iconMap[row.itemTypeIconName] && 
                  React.createElement(iconMap[row.itemTypeIconName], { size: 18 })}
                <Typography fontWeight="bold">{row.itemTypeName}</Typography>
              </Box>
              <Chip 
                label={row.quantity <= row.minStock ? "Bajo Stock" : "OK"} 
                color={row.quantity <= row.minStock ? "error" : "success"}
                size="small"
              />
            </div>
            <div className="card-body">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box className="color-dot" sx={{ backgroundColor: row.hexColor }} />
                <Typography variant="body2" color="textSecondary">
                  {row.colorName} {row.size ? `(${row.size})` : ''}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" sx={{ lineHeight: 1 }}>{row.quantity}</Typography>
                <Typography variant="caption" color="textSecondary">Mínimo: {row.minStock}</Typography>
              </Box>
            </div>
            <div className="card-footer">
              <IconButton size="small" onClick={() => onEdit(row._original)} color="primary">
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => onDelete(row.id)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </div>
          </Paper>
        ))}
      </Box>
    );
  }

  return (
    <Box className="stock-table-container">
      <DataGrid
                rows={rows}
                columns={columns}
                loading={loading}
                localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                className="custom-data-grid"
                initialState={{
                    pagination: { paginationModel: { pageSize: 15 } },
                    sorting: { sortModel: [{ field: 'itemTypeName', sort: 'asc' }] },
                }}
                pageSizeOptions={[15, 30, 50]}
                disableRowSelectionOnClick
                density="comfortable"
                rowHeight={65}
                sx={{
                    '& .MuiDataGrid-row:hover': {
                        backgroundColor: '#f8f4ff !important',
                        cursor: 'default'
                    }
                }}
            />
        </Box>
    );
};

export default ItemStockTable;
