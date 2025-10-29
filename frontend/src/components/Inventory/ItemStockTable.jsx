// src/components/Inventory/ItemStockTable.jsx
import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import { Edit as EditIcon, DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { iconMap } from '../../data/iconCategories'; // Ajusta ruta
import { COLOR_DICTIONARY } from '../../data/colorDictionary'; // Ajusta ruta

// import '../../styles/components/itemStockTable.css'; // Ajusta ruta

const getColorName = (hex) => {
  const color = COLOR_DICTIONARY.find((c) => c.hex?.toUpperCase() === hex?.toUpperCase());
  return color ? color.name : hex || '-';
};

const ItemStockTable = ({ stockItems = [], onEdit, onDelete, loading = false }) => {
  const columns = [
    {
      field: 'itemTypeName',
      headerName: 'Tipo',
      minWidth: 180,
      flex: 1.5,
      renderCell: (params) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflow: 'hidden',
          }}
        >
          {params.row.itemTypeIconName &&
            iconMap[params.row.itemTypeIconName] &&
            React.createElement(iconMap[params.row.itemTypeIconName], {
              size: 18,
            })}
          <Typography variant="body2" noWrap title={params.value}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'hexColor',
      headerName: 'Color',
      minWidth: 120,
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {params.value && (
            <Box
              component="span"
              title={params.value}
              sx={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: params.value,
                border: '1px solid var(--gray-300)',
              }}
            />
          )}
          <Typography variant="body2">{getColorName(params.value)}</Typography>
        </Box>
      ),
    },
    {
      field: 'size',
      headerName: 'Talla',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) =>
        params.value ? <Chip label={params.value} size="small" variant="outlined" /> : '-',
    },
    {
      field: 'quantity',
      headerName: 'Stock (Min)',
      type: 'number',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      cellClassName: (params) => {
        if (params.value == null) return '';
        const isLowStock = params.value <= params.row.minStock;
        const isWarningStock = !isLowStock && params.value <= params.row.minStock * 1.2;
        return isLowStock ? 'low-stock-cell' : isWarningStock ? 'warning-stock-cell' : '';
      },
      renderCell: (params) => (
        <Typography variant="body2" component="div">
          {params.value}
          <Typography variant="caption" color="textSecondary" sx={{ ml: 0.5 }}>
            ({params.row.minStock})
          </Typography>
        </Typography>
      ),
    },
    {
      field: 'price',
      headerName: 'Precio Base',
      type: 'number',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value) => (value != null ? `$${value.toLocaleString('es-CL')}` : '-'),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Acciones',
      width: 100, // Un poco menos de espacio
      cellClassName: 'actions',
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Editar"
          className="textPrimary"
          onClick={() => onEdit(params.row)}
          color="inherit"
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

  // Mapear datos
  const rows = stockItems.map((item) => ({
    id: item.id,
    itemTypeName: item.itemType?.name || 'Desconocido',
    itemTypeIconName: item.itemType?.iconName,
    hexColor: item.hexColor,
    size: item.size,
    quantity: item.quantity,
    minStock: item.minStock,
    price: item.price,
    _original: item,
  }));

  return (
    <Box sx={{ height: 600, width: '100%', mt: 2 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
          sorting: { sortModel: [{ field: 'itemTypeName', sort: 'asc' }] },
        }}
        pageSizeOptions={[10, 25, 50]}
        autoHeight={false}
        density="compact"
        disableRowSelectionOnClick
        sx={{
          border: '1px solid var(--gray-300)',
          borderRadius: 'var(--border-radius-sm)',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'var(--gray-100)',
            borderBottom: '1px solid var(--gray-300)',
            color: 'var(--gray-900)',
            fontWeight: 'bold',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid var(--gray-200)',
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid var(--gray-300)',
          },
          '& .low-stock-cell': {
            color: 'var(--error-dark)',
            fontWeight: '600',
            backgroundColor: 'var(--error-light)',
          },
          '& .warning-stock-cell': {
            color: '#e67e22',
            backgroundColor: '#fdf3e1',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'var(--primary-light) !important',
            cursor: 'pointer',
          },
        }}
      />
    </Box>
  );
};

export default ItemStockTable;
