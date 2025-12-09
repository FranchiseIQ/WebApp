#!/usr/bin/env node

/**
 * Football Scores Fetcher
 *
 * Fetches NFL and NCAA football scores from ESPN API (free, no key needed)
 * and saves to data/football/current-week.json
 *
 * ESPN provides a free public API for sports scores:
 * NFL: http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
 * NCAA: http://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard
 */

const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_FILE = path.join(__dirname, '../data/football/current-week.json');
const NFL_API = 'http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
const NCAA_API = 'http://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard';

/**
 * Fetch data from URL
 */
async function fetchData(url) {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch from ${url}:`, error.message);
        return null;
    }
}

/**
 * Transform ESPN game data to our format
 */
function transformGame(espnGame, league) {
    const competition = espnGame.competitions[0];
    const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

    // Determine status
    let status = 'scheduled';
    if (espnGame.status.type.completed) {
        status = 'final';
    } else if (espnGame.status.type.state === 'in') {
        status = 'in_progress';
    }

    // Extract video highlight URL if available
    let highlightUrl = null;
    let highlightTitle = null;

    // Check for headlines with video
    if (competition.headlines && competition.headlines.length > 0) {
        for (const headline of competition.headlines) {
            if (headline.video && headline.video.length > 0) {
                const video = headline.video[0];
                if (video.links && video.links.source) {
                    // Try to get the best quality source
                    highlightUrl = video.links.source.mezzanine?.href ||
                                   video.links.source.HD?.href ||
                                   video.links.source.full?.href ||
                                   video.links.source.href;
                    highlightTitle = headline.shortLinkText || headline.description || 'Game Highlights';
                }
                break;
            }
        }
    }

    // Generate YouTube search URL as fallback for completed games
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${awayTeam.team.displayName} vs ${homeTeam.team.displayName} ${league} highlights`
    )}`;

    return {
        id: `${league.toLowerCase()}-${espnGame.season}-${espnGame.id}`,
        league: league,
        season: parseInt(espnGame.season),
        week: espnGame.week?.number || getCurrentWeek(),
        startTime: espnGame.date,
        homeTeam: {
            id: homeTeam.team.id,
            name: homeTeam.team.displayName,
            shortName: homeTeam.team.shortDisplayName || homeTeam.team.name,
            abbreviation: homeTeam.team.abbreviation,
            logoUrl: homeTeam.team.logo
        },
        awayTeam: {
            id: awayTeam.team.id,
            name: awayTeam.team.displayName,
            shortName: awayTeam.team.shortDisplayName || awayTeam.team.name,
            abbreviation: awayTeam.team.abbreviation,
            logoUrl: awayTeam.team.logo
        },
        status: status,
        homeScore: status !== 'scheduled' ? parseInt(homeTeam.score) : null,
        awayScore: status !== 'scheduled' ? parseInt(awayTeam.score) : null,
        quarter: competition.status?.period || null,
        clock: competition.status?.displayClock || null,
        possession: competition.situation?.possession === homeTeam.team.id ? 'home' :
                    competition.situation?.possession === awayTeam.team.id ? 'away' : null,
        // Video highlights
        highlight: highlightUrl,
        highlightTitle: highlightTitle,
        youtubeSearch: youtubeSearchUrl,
        // Venue info
        venue: competition.venue?.fullName || null
    };
}

/**
 * Get current week number (simple approximation)
 */
function getCurrentWeek() {
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 8, 1); // Sept 1
    const weeksSinceStart = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(weeksSinceStart, 1), 18);
}

/**
 * Main function
 */
async function main() {
    console.log('🏈 Fetching football scores...');
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    const allGames = [];
    let currentWeek = getCurrentWeek();

    // Fetch NFL games
    console.log('📡 Fetching NFL scores from ESPN...');
    const nflData = await fetchData(NFL_API);
    if (nflData && nflData.events) {
        const nflGames = nflData.events.map(event => transformGame(event, 'NFL'));
        allGames.push(...nflGames);
        console.log(`✓ Fetched ${nflGames.length} NFL games`);

        // Use NFL week if available
        if (nflData.week?.number) {
            currentWeek = nflData.week.number;
        }
    } else {
        console.warn('⚠️ Failed to fetch NFL games');
    }

    // Fetch NCAA games
    console.log('📡 Fetching NCAA scores from ESPN...');
    const ncaaData = await fetchData(NCAA_API);
    if (ncaaData && ncaaData.events) {
        const ncaaGames = ncaaData.events.map(event => transformGame(event, 'NCAA'));
        allGames.push(...ncaaGames);
        console.log(`✓ Fetched ${ncaaGames.length} NCAA games`);
    } else {
        console.warn('⚠️ Failed to fetch NCAA games');
    }

    // Create output data structure
    const output = {
        season: new Date().getFullYear(),
        week: currentWeek,
        lastUpdated: new Date().toISOString(),
        games: allGames
    };

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

    console.log(`✅ Saved ${allGames.length} total games to ${OUTPUT_FILE}`);
    console.log(`   NFL: ${allGames.filter(g => g.league === 'NFL').length} games`);
    console.log(`   NCAA: ${allGames.filter(g => g.league === 'NCAA').length} games`);
    console.log(`   Live: ${allGames.filter(g => g.status === 'in_progress').length} games`);
}

// Run main function
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
