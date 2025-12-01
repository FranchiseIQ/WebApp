# Interactive Franchise Map

An interactive map showing franchise locations across North America using Mapbox GL JS and OpenStreetMap.

## Features

- 🗺️ Interactive pan and zoom
- 📍 Clickable location markers with detailed information
- 🎨 Color-coded by franchise category
- 🔍 Brand filtering
- 📱 Mobile responsive with touch controls
- 🌐 Built on Mapbox and OpenStreetMap

## Setup Instructions

### 1. Get a Free Mapbox API Token

1. Visit https://account.mapbox.com/
2. Sign up for a free account (no credit card required)
3. Navigate to "Access tokens" page
4. Copy your default public token OR create a new one

**Free Tier Limits:**
- 50,000 map loads per month
- Perfect for personal and small business use

### 2. Add Your Token

Open `FranchiseMap/map.js` and replace the placeholder token on line 7:

```javascript
mapboxgl.accessToken = 'YOUR_TOKEN_HERE';
```

### 3. Deploy

The map is ready to use! Deploy to:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

## Customization

### Adding Locations

Edit the `franchiseLocations` array in `map.js`:

```javascript
{
    brand: 'MCD',
    name: "McDonald's - Location Name",
    type: 'QSR',
    lat: 40.7580,
    lng: -73.9855,
    address: '123 Main St, City, State',
    color: '#ff6b6b'
}
```

### Brand Types

- `QSR` - Quick Service Restaurant (Red: #ff6b6b)
- `Casual` - Casual Dining (Teal: #4ecdc4)
- `Hotel` - Hotel/Hospitality (Blue: #45b7d1)
- `Fitness` - Fitness/Wellness (Green: #96ceb4)
- `Service` - Business Services (Orange: #ffa07a)

### Map Styles

Change the map style on line 17 of `map.js`:

```javascript
style: 'mapbox://styles/mapbox/streets-v12'
```

Available styles:
- `streets-v12` - Default street map
- `satellite-v9` - Satellite imagery
- `outdoors-v12` - Outdoor/terrain
- `light-v11` - Light theme
- `dark-v11` - Dark theme

## Embedding

### HTML/Website

```html
<iframe src="https://your-domain.com/FranchiseMap/map.html"
        width="100%"
        height="600"
        frameborder="0"
        style="border: none;">
</iframe>
```

### Notion

1. Copy URL: `https://your-domain.com/FranchiseMap/map.html`
2. In Notion, type `/embed`
3. Paste the URL
4. Adjust height to 600px

## Technical Details

- **Mapbox GL JS**: v3.0.1
- **OpenStreetMap**: Base map data
- **No backend required**: Fully client-side
- **Mobile-optimized**: Touch controls, responsive design

## Attribution

As required by Mapbox and OpenStreetMap:
- © Mapbox
- © OpenStreetMap contributors

## Support

For issues or questions:
1. Check Mapbox documentation: https://docs.mapbox.com/
2. OpenStreetMap wiki: https://wiki.openstreetmap.org/

## License

MIT License - Free for commercial and personal use
