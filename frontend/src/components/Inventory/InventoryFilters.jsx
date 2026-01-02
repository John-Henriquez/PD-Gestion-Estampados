import { useState } from 'react';
import {
  Box, Button, Grid, TextField, Typography, MenuItem, 
  InputAdornment, FormControl, InputLabel, Select,
  Accordion, AccordionSummary, AccordionDetails, Chip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import FilterAltIcon from '@mui/icons-material/FilterAlt';

import '../../styles/components/inventoryFilters.css';

const InventoryFilters = ({
  filters,
  onFilterChange,
  onResetFilters,
  itemTypes = [],
  colorOptions = [],
}) => {
  const [expanded, setExpanded] = useState(true);

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      className="inventory-filters-card"
      disableGutters
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        className="filters-header"
      >
      <Box className="header-content">
          <FilterAltIcon color="primary" />
          <Typography className="filters-title">
            Búsqueda Avanzada
          </Typography>

          {activeFiltersCount > 0 && (
            <Chip 
              label={`${activeFiltersCount} activos`} 
              size="small" 
              color="info" 
              className="active-badge"
            />
          )}
        </Box>
      </AccordionSummary>

      <AccordionDetails className="filters-body">
        <Grid container spacing={2}>
          <Grid item xs={12} lg={4}>
            <TextField
              fullWidth
              variant="filled"
              label="Buscar por nombre o color"
              name="searchTerm"
              value={filters.searchTerm}
              onChange={onFilterChange}
              placeholder="Ej: Polera Roja..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3} lg={2}>
            <FormControl fullWidth variant="filled">
              <InputLabel>Tipo</InputLabel>
              <Select 
                name="typeId" 
                value={filters.typeId}
                onChange={onFilterChange}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                {itemTypes.map(type => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3} lg={2}>
            <FormControl fullWidth variant="filled">
              <InputLabel>Color</InputLabel>
              <Select
                name="color"
                value={filters.color}
                onChange={onFilterChange}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                {colorOptions.map(({ id, name, hex }) => (
                  <MenuItem key={id} value={id}>
                    <Box className="color-option">
                      <span
                        className="swatch-indicator"
                        style={{ backgroundColor: hex }}
                      />
                      {name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3} lg={1.5}>
            <FormControl fullWidth variant="filled">
              <InputLabel>Talla</InputLabel>
              <Select
                name="size"
                value={filters.size}
                onChange={onFilterChange}
              >
                <MenuItem value=""><em>Todas</em></MenuItem>
                {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                  <MenuItem key={size} value={size}>{size}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3} lg={2.5}>
            <FormControl fullWidth variant="filled">
              <InputLabel>Estado Stock</InputLabel>
              <Select
                name="stockStatus"
                value={filters.stockStatus}
                onChange={onFilterChange}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                <MenuItem value="low" className="text-error">Bajo stock</MenuItem>
                <MenuItem value="normal">Stock normal</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} className="filters-actions">
            <Button
              variant="text"
              onClick={onResetFilters}
              startIcon={<FilterListOffIcon />}
              className="reset-btn"
              disabled={activeFiltersCount === 0}
            >
              Limpiar todos los filtros
            </Button>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default InventoryFilters;
