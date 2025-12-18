import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import { Edit as EditIcon, DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { iconMap } from '../../data/iconCategories';


const ItemStockTable = ({ stockItems = [], onEdit, onDelete, loading = false }) => {
  const columns = [
    {
      field: 'itemTypeName',
      headerName: 'Tipo',
      minWidth: 180,
      flex: 2,
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
      field: 'colorName',
      headerName: 'Color',
      minWidth: 120,
      flex: 1.5,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {params.row.hexColor && (
            <Box
              component="span"
              title={params.row.hexColor}
              sx={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: params.row.hexColor,
                border: '1px solid var(--gray-300)',
              }}
            />
          )}
          <Typography variant="body2">{params.value}</Typography>
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
      field: 'actions',
      type: 'actions',
      headerName: 'Acciones',
      width: 100,
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
