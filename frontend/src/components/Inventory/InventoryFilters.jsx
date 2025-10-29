import { useState } from 'react';
import {
    Box, Button, Grid, TextField, Typography, MenuItem, InputAdornment,
    FormControl, InputLabel, Select, Accordion, AccordionSummary, AccordionDetails
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
    colorOptions = []
}) => {
    const [expanded, setExpanded] = useState(true);

    const handleAccordionChange = (event, isExpanded) => {
        setExpanded(isExpanded);
    };

    return (
        <Accordion
            expanded={expanded}
            onChange={handleAccordionChange}
            className="inventory-filters-accordion" 
            sx={{ mb: 3 }} 
            defaultExpanded 
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="inventory-filters-content"
                id="inventory-filters-header"
                className="inventory-filters-header" 
            >
                <Typography variant="h6">Filtros de Búsqueda</Typography>
            </AccordionSummary>
            <AccordionDetails className="inventory-filters-details"> 
                <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Buscar por nombre"
                            name="searchTerm"
                            value={filters.searchTerm}
                            onChange={onFilterChange}
                            fullWidth
                            size="small" 
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end"><SearchIcon /></InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                             <InputLabel>Tipo</InputLabel>
                             <Select
                                 label="Tipo"
                                 name="typeId"
                                 value={filters.typeId}
                                 onChange={onFilterChange}
                             >
                                <MenuItem value="">Todos</MenuItem>
                                {itemTypes.map(type => (
                                    <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                                ))}
                             </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Color</InputLabel>
                            <Select
                                name="color"
                                value={filters.color}
                                onChange={onFilterChange}
                                label="Color"
                                renderValue={(selectedValue) => {
                                    if (!selectedValue) return <em>Todos</em>;
                                    const selectedColor = colorOptions.find(c => c.name === selectedValue);
                                    return (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                             {selectedColor?.hex && (
                                                <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: selectedColor.hex, border: '1px solid #ccc' }} />
                                             )}
                                             {selectedValue}
                                        </Box>
                                    );
                                }}
                            >
                                <MenuItem value=""><em>Todos</em></MenuItem>
                                {colorOptions.map(({ name, hex }) => (
                                    <MenuItem key={name} value={name}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {hex && <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: hex, mr: 1 }} />}
                                            {name.charAt(0).toUpperCase() + name.slice(1)}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                     <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth size="small">
                              <InputLabel>Talla</InputLabel>
                              <Select name="size" value={filters.size} onChange={onFilterChange} label="Talla">
                                <MenuItem value="">Todas</MenuItem>
                                <MenuItem value="S">S</MenuItem>
                                <MenuItem value="M">M</MenuItem>
                                <MenuItem value="L">L</MenuItem>
                                <MenuItem value="XL">XL</MenuItem>
                                <MenuItem value="XXL">XXL</MenuItem>
                              </Select>
                          </FormControl>
                     </Grid>
                     <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth size="small">
                              <InputLabel>Estado Stock</InputLabel>
                              <Select value={filters.stockStatus} onChange={onFilterChange} name="stockStatus" label="Estado Stock">
                                 <MenuItem value="">Todos</MenuItem>
                                 <MenuItem value="low">Bajo stock</MenuItem>
                                 <MenuItem value="normal">Stock normal</MenuItem>
                              </Select>
                          </FormControl>
                     </Grid>
                    {/* Botón Limpiar */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Button
                            variant="outlined"
                            onClick={onResetFilters}
                            fullWidth
                            startIcon={<FilterListOffIcon />}
                            className="inventory-button inventory-button--outlined" 
                            size="medium" 
                        >
                            Limpiar Filtros
                        </Button>
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>
    );
};

export default InventoryFilters;