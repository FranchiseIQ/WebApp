#!/usr/bin/env node

/**
 * NBA Scores Fetcher
 *
 * Fetches NBA scores from ESPN API (free, no key needed)
 * and saves to data/basketball/current-games.json
 *
 * ESPN NBA API: http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard
 */

const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_FILE = path.join(__dirname, '../data/basketball/current-games.json');
const NBA_API = 'http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';

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
function transformGame(espnGame) {
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

    return {
        id: `nba-${espnGame.season?.year || new Date().getFullYear()}-${espnGame.id}`,
        league: 'NBA',
        season: espnGame.season?.year || new Date().getFullYear(),
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
        period: competition.status?.period || null,
        clock: competition.status?.displayClock || null,
        venue: competition.venue?.fullName || null
    };
}

/**
 * Main function
 */
async function main() {
    console.log('🏀 Fetching NBA scores...');
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    // Fetch NBA games
    console.log('📡 Fetching NBA scores from ESPN...');
    const nbaData = await fetchData(NBA_API);

    if (!nbaData || !nbaData.events) {
        console.warn('⚠️ Failed to fetch NBA games or no games available');
        // Create empty output if no data
        const output = {
            season: new Date().getFullYear(),
            lastUpdated: new Date().toISOString(),
            games: []
        };

        const outputDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
        console.log('📝 Created empty games file (no games today)');
        return;
    }

    const games = nbaData.events.map(event => transformGame(event));
    console.log(`✓ Fetched ${games.length} NBA games`);

    // Create output data structure
    const output = {
        season: nbaData.season?.year || new Date().getFullYear(),
        lastUpdated: new Date().toISOString(),
        games: games
    };

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

    console.log(`✅ Saved ${games.length} games to ${OUTPUT_FILE}`);
    console.log(`   Live: ${games.filter(g => g.status === 'in_progress').length} games`);
    console.log(`   Final: ${games.filter(g => g.status === 'final').length} games`);
    console.log(`   Scheduled: ${games.filter(g => g.status === 'scheduled').length} games`);
}

// Run main function
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
