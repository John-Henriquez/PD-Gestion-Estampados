import React from 'react';
import { Box, Chip, Typography, Paper, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import { 
    DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import { iconMap } from '../../data/iconCategories';
import '../../styles/components/itemStockTable.css';


const ItemStockTable = ({ stockItems = [], onDelete, loading = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), {
    noSsr: true,
  });


  const rows = stockItems.map((item) => ({
    id: item.id,
    itemTypeName: item.itemType?.name || 'Desconocido',
    itemTypeIconName: item.itemType?.iconName,
    colorName: item.color?.name || 'Desconocido',
    hexColor: item.color?.hex || '#FFFFFF',
    size: item.size,
    quantity: item.quantity,
    minStock: item.minStock,
  }));

  const columns = [
    {
      field: 'itemTypeName',
      headerName: 'Tipo',
      minWidth: 220,
      flex: 1,
      renderCell: (params) => (
        <Box className="table-type-cell">
          {params.row.itemTypeIconName &&
            iconMap[params.row.itemTypeIconName] && 
            React.createElement(iconMap[params.row.itemTypeIconName], { 
                size: 18, 
            })
          }
          <Typography noWrap fontWeight={500}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'colorName',
      headerName: 'Variante',
      minWidth: 180,
      flex: 1,
      renderCell: (params) => (
        <Box className="table-variant-cell">
          <span
            className="color-dot"
            style={{ backgroundColor: params.row.hexColor }}
          />
          <Typography variant="body2">
            {params.value}
            {params.row.size ? ` (${params.row.size})` : ''}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'quantity',
      headerName: 'Stock',
      minWidth: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Box textAlign="right">
          <Typography fontWeight={700}>{params.value}</Typography>
          <Typography variant="caption">
            Mín: {params.row.minStock}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Acciones',
      width: 70,
      getActions: (params) => [
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Eliminar"
          onClick={() => onDelete(params.id)}
          color="error"
        />,
      ],
    },
  ];

  if (isMobile) {
    return (
      <Box className="stock-mobile-list">
        {rows.map((row) => (
          <Paper key={row.id} className="stock-mobile-card" elevation={0}>
            <div className="card-header">
              <Typography fontWeight={600}>
                {row.itemTypeName}
              </Typography>
              <Chip
                size="small"
                label={row.quantity <= row.minStock ? 'Bajo stock' : 'OK'}
                color={row.quantity <= row.minStock ? 'error' : 'success'}
              />
            </div>

            <div className="card-body">
              <div className="variant">
                <span
                  className="color-dot"
                  style={{ backgroundColor: row.hexColor }}
                />
                <Typography variant="body2">
                  {row.colorName}
                  {row.size ? ` (${row.size})` : ''}
                </Typography>
              </div>

              <div className="stock">
                <Typography variant="h6">{row.quantity}</Typography>
                <Typography variant="caption">
                  Mín: {row.minStock}
                </Typography>
              </div>
            </div>

            <div className="card-footer">
              <IconButton
                size="small"
                onClick={() => onDelete(row.id)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </div>
          </Paper>
        ))}
      </Box>
    );
  }

  return (
   <Box className="stock-table-wrapper">
    <DataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      localeText={esES.components.MuiDataGrid.defaultProps.localeText}
      pageSizeOptions={[15, 30, 50]}
      initialState={{
        pagination: { paginationModel: { pageSize: 15 } },
      }}
      disableRowSelectionOnClick
      rowHeight={64}
      autoHeight
      sx={{
        minWidth: { xs: '100%', md: 680 },
        borderRadius: 2,
        borderColor: 'divider',
      }}
    />
  </Box>
  );
};

export default ItemStockTable;
