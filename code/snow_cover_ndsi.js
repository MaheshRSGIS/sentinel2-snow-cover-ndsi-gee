// PROJECT: Snow Cover Mapping Using NDSI
// Platform: Google Earth Engine
// Dataset: Sentinel-2 SR Harmonized
// Period: 15 September – 15 October 2017
// Index: Normalized Difference Snow Index (NDSI)

Map.addLayer(roi);

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(roi)
  .filterDate("2017-09-15", '2017-10-15')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));
Map.addLayer(s2,vizparam);

// Calculate NDSI
// For Sentinel-2 (NDSI = (Green - SWIR) / (Green + SWIR))

var s2ndsi = function(image)
{
   var ndsi = image.normalizedDifference(['B3', 'B11']).rename('NDSI');
  
   return image.addBands(ndsi);
 };
var ndsicollection=s2.map(s2ndsi).select('NDSI');

Map.addLayer(ndsicollection, {}, 'Sentinel-2 NDSI Collection');

var s2Median = ndsicollection.median().select('NDSI').clip(roi);

Map.addLayer(s2Median, {}, 'Sentinel-2 NDSI');

var ClipOfMap = s2Median.clip(roi);

// Histogram of NDSI (Example for Sentinel-2)

var histogram = ui.Chart.image.histogram({
  image: s2Median,
  region: roi,
  scale: 100, 
  }).setOptions({
  title: 'NDSI Histogram (Sentinel-2)',
  hAxis: {title: 'NDSI Value'},
  vAxis: {title: 'Pixel Count'},
});

print(histogram);

var snow = s2Median.gt(0.38).selfMask().rename('SnowCover');
Map.addLayer(snow,imageVisParam,'Snow');


// Apply Threshold for Snow Cover

function applyThreshold(image) {
  return image.gt(0.25).selfMask().rename('SnowCover');
}

var s2Snow = applyThreshold(s2Median);
Map.addLayer(s2Snow, {palette:['red']}, 'Sentinel-2 Snow Cover');

// Estimate Snow Area (in sq.km)

var area = snow.multiply(ee.Image.pixelArea()).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: roi,
    scale: 20,
    maxPixels: 1e13
  });
  
var areaSqKm = ee.Number(area.get('SnowCover')).divide(1e6);

print('S2 Snow Cover Area (sq.km):', areaSqKm);

// Export Final Image (Sentinel-2)

Export.image.toDrive({
  image: s2Median,
  description: 'Sentinel2_SnowCover_NDSI',
  folder: 'GEE_Exports',
  region: roi,
  scale: 20,
 
});
