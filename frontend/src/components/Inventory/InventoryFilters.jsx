import { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  MenuItem,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';

import '../../styles/components/inventoryFilters.css';

const InventoryFilters = ({
  filters,
  onFilterChange,
  onResetFilters,
  itemTypes = [],
  colorOptions = [],
}) => {
  const [expanded, setExpanded] = useState(true);

  const handleAccordionChange = (event, isExpanded) => {
    setExpanded(isExpanded);
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  return (
    <Accordion
      expanded={expanded}
      onChange={handleAccordionChange}
      className="inventory-filters-accordion"
      sx={{ mb: 3 }}
      defaultExpanded
      disableGutters
      elevation={1}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="inventory-filters-content"
        id="inventory-filters-header"
        className="inventory-filters-header"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">Filtros de Búsqueda</Typography>
          {!expanded && hasActiveFilters && (
            <Box component="span" className="active-filters-indicator" title="Filtros activos">
              🔵
            </Box>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails className="inventory-filters-details">
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} md={6} lg={4}>
            <TextField
              label="Buscar por nombre"
              name="searchTerm"
              value={filters.searchTerm}
              onChange={onFilterChange}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={2}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>Tipo</InputLabel>
              <Select label="Tipo" name="typeId" value={filters.typeId} onChange={onFilterChange}>
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                {itemTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={2}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>Color</InputLabel>
              <Select
                name="color"
                value={filters.color}
                onChange={onFilterChange}
                label="Color"
                renderValue={(selectedValue) => {
                  if (!selectedValue) return <em>Todos</em>;
                  const selectedColor = colorOptions.find((c) => c.name === selectedValue);
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {selectedColor?.hex && (
                        <Box className="color-swatch-small" sx={{ bgcolor: selectedColor.hex }} />
                      )}
                      {selectedValue}
                    </Box>
                  );
                }}
              >
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                {colorOptions.map(({ name, hex }) => (
                  <MenuItem key={name} value={name}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {hex && <Box className="color-swatch-small" sx={{ bgcolor: hex }} />}
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Filtro Talla */}
          <Grid item xs={12} sm={6} md={3} lg={1}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>Talla</InputLabel>
              <Select name="size" value={filters.size} onChange={onFilterChange} label="Talla">
                <MenuItem value="">
                  <em>Todas</em>
                </MenuItem>
                <MenuItem value="S">S</MenuItem>
                <MenuItem value="M">M</MenuItem>
                <MenuItem value="L">L</MenuItem>
                <MenuItem value="XL">XL</MenuItem>
                <MenuItem value="XXL">XXL</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={2}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>Estado Stock</InputLabel>
              <Select
                value={filters.stockStatus}
                onChange={onFilterChange}
                name="stockStatus"
                label="Estado Stock"
              >
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                <MenuItem value="low">Bajo stock</MenuItem>
                <MenuItem value="normal">Stock normal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={1}>
            <Button
              variant="outlined"
              onClick={onResetFilters}
              fullWidth
              startIcon={<FilterListOffIcon />}
              className="inventory-button inventory-button--outlined inventory-button--small-text"
              sx={{ height: '40px' }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default InventoryFilters;
