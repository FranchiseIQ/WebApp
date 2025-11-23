# Interactive Franchise Map

An interactive map showing franchise locations across North America using Google Maps JavaScript API.

## Features

- 🗺️ Interactive pan and zoom
- 📍 Clickable location markers with detailed information
- 🎨 Color-coded by franchise category
- 🔍 Brand filtering
- 📱 Mobile responsive with touch controls
- 🌐 Built on Google Maps with Street View and satellite imagery

## Setup Instructions

### 1. Get a Google Maps API Key

1. Visit https://developers.google.com/maps/gmp-get-started
2. Sign up for a Google Cloud account (free trial includes $300 credit)
3. Enable the Maps JavaScript API in your project
4. Create an API key from the Credentials page
5. Restrict your API key to specific URLs for security

**Free Tier Limits:**
- $200 monthly credit (~28,000+ map loads)
- No credit card required for initial setup
- Perfect for personal and small business use

### 2. Add Your API Key

Open `FranchiseMap/map.html` and replace YOUR_API_KEY on line 79:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap" async defer></script>
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

### Map Types

Google Maps includes built-in map types accessible via the map type control:

Available map types:
- **Roadmap** - Default street map view
- **Satellite** - Satellite imagery
- **Hybrid** - Satellite imagery with road overlay
- **Terrain** - Topographic features and elevation

Users can switch between these using the map type control in the top-right corner.

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

- **Google Maps JavaScript API**: Latest version
- **Google Street View**: Integrated street-level imagery
- **No backend required**: Fully client-side
- **Mobile-optimized**: Touch controls, responsive design
- **Built-in controls**: Zoom, street view, fullscreen, map type selector

## Attribution

As required by Google Maps:
- © Google
- Map data attribution is automatically included by Google Maps

## Support

For issues or questions:
1. Check Google Maps documentation: https://developers.google.com/maps/documentation/javascript
2. Google Maps Platform Support: https://support.google.com/maps

## License

MIT License - Free for commercial and personal use
