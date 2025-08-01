# Tennis Data Integration Guide

## Overview

This guide explains how to integrate external tennis scoring applications with the Tempuz Scoreboard system. The scoreboard can display live tennis data from any external source by adapting the data to our expected format.

## Table of Contents

1. [Data Structure Requirements](#data-structure-requirements)
2. [Integration Methods](#integration-methods)
3. [Setting Up Live Data Connections](#setting-up-live-data-connections)
4. [Data Transformation Examples](#data-transformation-examples)
5. [API Implementation](#api-implementation)
6. [Component Binding](#component-binding)
7. [Testing Integration](#testing-integration)
8. [Troubleshooting](#troubleshooting)

---

## Data Structure Requirements

### Expected Tennis Data Format

Your external tennis application data must be transformed into this JSON structure:

```json
{
  "matchId": "unique_match_identifier",
  "player1": {
    "name": "Roger Federer",
    "country": "SUI",
    "seed": 1
  },
  "player2": {
    "name": "Rafael Nadal", 
    "country": "ESP",
    "seed": 2
  },
  "score": {
    "player1Sets": 2,
    "player2Sets": 1,
    "player1Games": 6,
    "player2Games": 4,
    "player1Points": "40",
    "player2Points": "30"
  },
  "sets": {
    "set1": {
      "player1": 6,
      "player2": 4
    },
    "set2": {
      "player1": 7,
      "player2": 6
    },
    "set3": {
      "player1": 6,
      "player2": 4
    }
  },
  "serve": {
    "speed": "125 MPH"
  },
  "matchStatus": "in_progress",
  "servingPlayer": 1,
  "currentSet": 3,
  "isTiebreak": false
}
```

### Data Field Descriptions

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `matchId` | string | Unique identifier for the match | Yes |
| `player1.name` | string | Player 1 full name | Yes |
| `player1.country` | string | 3-letter country code | No |
| `player1.seed` | number | Tournament seeding | No |
| `player2.*` | object | Same structure as player1 | Yes |
| `score.player1Sets` | number | Sets won by player 1 | Yes |
| `score.player2Sets` | number | Sets won by player 2 | Yes |
| `score.player1Games` | number | Games in current set for player 1 | Yes |
| `score.player2Games` | number | Games in current set for player 2 | Yes |
| `score.player1Points` | string | Current game points ("0", "15", "30", "40", "AD") | Yes |
| `score.player2Points` | string | Current game points ("0", "15", "30", "40", "AD") | Yes |
| `sets` | object | Historical set scores | No |
| `serve.speed` | string | Last serve speed with unit | No |
| `matchStatus` | string | "in_progress", "completed", "not_started" | Yes |
| `servingPlayer` | number | 1 or 2 indicating who is serving | No |
| `currentSet` | number | Current set number (1, 2, 3, etc.) | Yes |
| `isTiebreak` | boolean | Whether current game is a tiebreak | No |

---

## Integration Methods

### Method 1: REST API Endpoint

**Best for:** Applications that can create HTTP endpoints

Create an HTTP endpoint in your tennis app that returns the formatted JSON data:

```javascript
// Example Express.js endpoint
app.get('/api/scoreboard/match/:matchId', (req, res) => {
  const matchData = getMatchData(req.params.matchId);
  const scoreboardData = transformToScoreboardFormat(matchData);
  res.json(scoreboardData);
});
```

### Method 2: WebSocket Stream

**Best for:** Real-time applications with frequent updates

```javascript
// WebSocket server example
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  // Send initial data
  ws.send(JSON.stringify(getCurrentMatchData()));
  
  // Send updates when score changes
  onScoreUpdate((newData) => {
    ws.send(JSON.stringify(transformToScoreboardFormat(newData)));
  });
});
```

### Method 3: File-based Integration

**Best for:** Applications that can write to shared files

Write JSON data to a file that the scoreboard polls:

```javascript
// Write to shared file
const fs = require('fs');

function updateScoreboardFile(matchData) {
  const scoreboardData = transformToScoreboardFormat(matchData);
  fs.writeFileSync('/shared/tennis_data.json', JSON.stringify(scoreboardData));
}
```

### Method 4: Database Integration

**Best for:** Applications using shared databases

Create a database view or table that the scoreboard can query:

```sql
-- Example database view
CREATE VIEW scoreboard_data AS
SELECT 
  match_id as matchId,
  player1_name as player1_name,
  player2_name as player2_name,
  -- ... other fields
FROM tennis_matches 
WHERE status = 'live';
```

### Method 5: Firebase Integration

**Best for:** Tennis apps using Firebase as backend

Firebase offers multiple ways to expose your tennis data to the scoreboard system.

#### Option A: Firebase Realtime Database with Public Read Access

Set up database rules to allow public read access to match data:

```javascript
// Firebase Realtime Database Rules
{
  "rules": {
    "public_matches": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

Direct REST API access to Firebase:
```
GET https://your-project.firebaseio.com/public_matches/current_match.json
```

#### Option B: Cloud Functions API Endpoint

Create a Firebase Cloud Function that formats and serves your data:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.getScoreboardData = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  
  try {
    const matchId = req.query.match || 'current';
    const matchRef = admin.database().ref(`matches/${matchId}`);
    const snapshot = await matchRef.once('value');
    const matchData = snapshot.val();
    
    if (!matchData) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    // Transform Firebase data to scoreboard format
    const scoreboardData = {
      matchId: matchData.id,
      player1: {
        name: matchData.player1?.name || '',
        country: matchData.player1?.country || '',
        seed: matchData.player1?.seed || 0
      },
      player2: {
        name: matchData.player2?.name || '',
        country: matchData.player2?.country || '',
        seed: matchData.player2?.seed || 0
      },
      score: {
        player1Sets: matchData.score?.player1Sets || 0,
        player2Sets: matchData.score?.player2Sets || 0,
        player1Games: matchData.score?.player1Games || 0,
        player2Games: matchData.score?.player2Games || 0,
        player1Points: matchData.score?.player1Points || '0',
        player2Points: matchData.score?.player2Points || '0'
      },
      sets: matchData.sets || {},
      serve: matchData.serve || {},
      matchStatus: matchData.status || 'not_started',
      servingPlayer: matchData.servingPlayer || 1,
      currentSet: matchData.currentSet || 1,
      isTiebreak: matchData.isTiebreak || false
    };
    
    res.json(scoreboardData);
  } catch (error) {
    console.error('Error fetching match data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

Deploy the function:
```bash
firebase deploy --only functions
```

Your API endpoint will be:
```
https://us-central1-your-project.cloudfunctions.net/getScoreboardData?match=match_id
```

#### Option C: Firestore with REST API

If using Cloud Firestore, access via REST API:

```javascript
// Example Firestore document structure
{
  "matches/current_match": {
    "matchId": "live_match_001",
    "player1": {
      "name": "Roger Federer",
      "country": "SUI",
      "seed": 1
    },
    "player2": {
      "name": "Rafael Nadal", 
      "country": "ESP",
      "seed": 2
    },
    "score": {
      "player1Sets": 2,
      "player2Sets": 1,
      "player1Games": 6,
      "player2Games": 4,
      "player1Points": "40",
      "player2Points": "30"
    },
    "lastUpdated": "2023-07-14T15:30:00Z"
  }
}
```

Access via Firestore REST API:
```
GET https://firestore.googleapis.com/v1/projects/your-project/databases/(default)/documents/matches/current_match
```

#### Option D: Firebase Middleware Service

Create a Node.js service that connects to Firebase and serves formatted data:

```javascript
// firebase-middleware.js
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// Initialize Firebase Admin
const serviceAccount = require('./path/to/service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project.firebaseio.com'
});

const app = express();
app.use(cors());

// Get current match data
app.get('/api/current-match', async (req, res) => {
  try {
    const db = admin.database();
    const matchRef = db.ref('currentMatch');
    const snapshot = await matchRef.once('value');
    const firebaseData = snapshot.val();
    
    // Transform to scoreboard format
    const scoreboardData = transformFirebaseToScoreboard(firebaseData);
    res.json(scoreboardData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listen for real-time updates (WebSocket alternative)
app.get('/api/match-stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  const db = admin.database();
  const matchRef = db.ref('currentMatch');
  
  const sendUpdate = (snapshot) => {
    const data = transformFirebaseToScoreboard(snapshot.val());
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  
  matchRef.on('value', sendUpdate);
  
  req.on('close', () => {
    matchRef.off('value', sendUpdate);
  });
});

function transformFirebaseToScoreboard(firebaseData) {
  if (!firebaseData) return null;
  
  return {
    matchId: firebaseData.matchId || 'unknown',
    player1: {
      name: firebaseData.players?.[0]?.name || firebaseData.player1?.name || '',
      country: firebaseData.players?.[0]?.country || firebaseData.player1?.country || '',
      seed: firebaseData.players?.[0]?.seed || firebaseData.player1?.seed || 0
    },
    player2: {
      name: firebaseData.players?.[1]?.name || firebaseData.player2?.name || '',
      country: firebaseData.players?.[1]?.country || firebaseData.player2?.country || '',
      seed: firebaseData.players?.[1]?.seed || firebaseData.player2?.seed || 0
    },
    score: {
      player1Sets: firebaseData.sets?.player1 || firebaseData.score?.player1Sets || 0,
      player2Sets: firebaseData.sets?.player2 || firebaseData.score?.player2Sets || 0,
      player1Games: firebaseData.games?.player1 || firebaseData.score?.player1Games || 0,
      player2Games: firebaseData.games?.player2 || firebaseData.score?.player2Games || 0,
      player1Points: firebaseData.points?.player1 || firebaseData.score?.player1Points || '0',
      player2Points: firebaseData.points?.player2 || firebaseData.score?.player2Points || '0'
    },
    sets: firebaseData.setHistory || firebaseData.sets || {},
    serve: firebaseData.serve || {},
    matchStatus: firebaseData.status || firebaseData.matchStatus || 'not_started',
    servingPlayer: firebaseData.serving || firebaseData.servingPlayer || 1,
    currentSet: firebaseData.currentSet || 1,
    isTiebreak: firebaseData.tiebreak || firebaseData.isTiebreak || false
  };
}

app.listen(3000, () => {
  console.log('Firebase middleware running on port 3000');
});
```

#### Firebase Security Considerations

**Public Data Access:**
- Only expose match data that should be publicly viewable
- Keep sensitive player information (contact details, etc.) in separate, protected paths
- Use Firebase Security Rules to control access

**Recommended Firebase Rules for Scoreboard Data:**
```javascript
{
  "rules": {
    // Public scoreboard data - read only
    "public_scoreboards": {
      ".read": true,
      ".write": false
    },
    // Current live matches - read only  
    "live_matches": {
      ".read": true,
      ".write": "auth != null && auth.uid == 'tournament_admin'"
    },
    // Private admin data - protected
    "admin": {
      ".read": "auth != null && auth.token.admin == true",
      ".write": "auth != null && auth.token.admin == true"
    }
  }
}
```

**API Key Management:**
- For Cloud Functions, no API key needed for public data
- For direct Firebase REST access, you can use anonymous authentication
- Never expose admin SDK service account keys in client-side code

#### Quick Firebase Setup Example

1. **Create Firebase Project**: 
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init functions
   ```

2. **Set up database structure**:
   ```javascript
   // Example Firebase Realtime Database structure
   {
     "live_matches": {
       "current": {
         "matchId": "wimbledon_final_2023",
         "player1": { "name": "Carlos Alcaraz", "country": "ESP" },
         "player2": { "name": "Novak Djokovic", "country": "SRB" },
         "score": {
           "player1Sets": 2, "player2Sets": 1,
           "player1Games": 6, "player2Games": 4,
           "player1Points": "40", "player2Points": "30"
         },
         "currentSet": 3,
         "matchStatus": "in_progress"
       }
     }
   }
   ```

3. **Deploy Cloud Function**:
   ```bash
   firebase deploy --only functions:getScoreboardData
   ```

4. **Use in Scoreboard**:
   - **Connection Name**: "Firebase Tennis Data"
   - **API URL**: `https://us-central1-your-project.cloudfunctions.net/getScoreboardData`
   - **Provider**: "API"

---

## Setting Up Live Data Connections

### 1. Open Live Data Manager

1. Launch the Tempuz Scoreboard application
2. Click **"Live Data"** in the sidebar
3. Click **"Manage Connections"**

### 2. Create New Connection

1. Click **"Add Connection"**
2. Fill in connection details:
   - **Name**: Descriptive name (e.g., "My Tennis App")
   - **API URL**: Your endpoint URL
   - **API Key**: Optional authentication key
   - **Provider**: Select "API" or "Mock"

### 3. Test Connection

1. Click **"Test Connection"** to verify data format
2. Check that all required fields are present
3. Ensure data updates correctly

---

## Data Transformation Examples

### Example 1: Basic Score Transformation

```javascript
// Your app's data format
const yourAppData = {
  match: {
    id: "wimbledon_2023_final",
    players: [
      { name: "Carlos Alcaraz", ranking: 1 },
      { name: "Novak Djokovic", ranking: 2 }
    ],
    currentScore: {
      sets: [2, 1],
      games: [6, 4], 
      points: [3, 2] // 0=0, 1=15, 2=30, 3=40
    }
  }
};

// Transform to scoreboard format
function transformToScoreboardFormat(data) {
  const pointsMap = ["0", "15", "30", "40"];
  
  return {
    matchId: data.match.id,
    player1: {
      name: data.match.players[0].name,
      seed: data.match.players[0].ranking
    },
    player2: {
      name: data.match.players[1].name,
      seed: data.match.players[1].ranking
    },
    score: {
      player1Sets: data.match.currentScore.sets[0],
      player2Sets: data.match.currentScore.sets[1],
      player1Games: data.match.currentScore.games[0],
      player2Games: data.match.currentScore.games[1],
      player1Points: pointsMap[data.match.currentScore.points[0]],
      player2Points: pointsMap[data.match.currentScore.points[1]]
    },
    matchStatus: "in_progress",
    currentSet: Math.max(...data.match.currentScore.sets) + 1
  };
}
```

### Example 2: Complex Tournament Data

```javascript
// Tournament management system transformation
function transformTournamentData(tournamentData) {
  const match = tournamentData.currentMatch;
  
  // Build sets history
  const sets = {};
  match.completedSets.forEach((set, index) => {
    sets[`set${index + 1}`] = {
      player1: set.scores[0],
      player2: set.scores[1]
    };
  });
  
  return {
    matchId: `${tournamentData.tournament.id}_${match.id}`,
    player1: {
      name: `${match.player1.firstName} ${match.player1.lastName}`,
      country: match.player1.nationality,
      seed: match.player1.seed
    },
    player2: {
      name: `${match.player2.firstName} ${match.player2.lastName}`,
      country: match.player2.nationality,
      seed: match.player2.seed
    },
    score: {
      player1Sets: match.setsWon[0],
      player2Sets: match.setsWon[1],
      player1Games: match.currentSet.games[0],
      player2Games: match.currentSet.games[1],
      player1Points: convertPoints(match.currentGame.points[0]),
      player2Points: convertPoints(match.currentGame.points[1])
    },
    sets: sets,
    serve: {
      speed: match.lastServe ? `${match.lastServe.speed} ${match.lastServe.unit}` : undefined
    },
    matchStatus: match.status,
    servingPlayer: match.server,
    currentSet: match.setNumber,
    isTiebreak: match.currentSet.isTiebreak
  };
}
```

---

## API Implementation

### REST API Requirements

Your API endpoint should:

1. **Accept GET requests** with optional match ID parameter
2. **Return JSON** in the required format
3. **Handle CORS** if accessed from browser
4. **Include proper headers**:
   ```
   Content-Type: application/json
   Access-Control-Allow-Origin: *
   ```

### Example PHP Implementation

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

function getScoreboardData($matchId = null) {
    // Get data from your tennis app database
    $matchData = getMatchFromDatabase($matchId);
    
    return [
        'matchId' => $matchData['id'],
        'player1' => [
            'name' => $matchData['player1_name'],
            'country' => $matchData['player1_country'],
            'seed' => $matchData['player1_seed']
        ],
        'player2' => [
            'name' => $matchData['player2_name'],
            'country' => $matchData['player2_country'], 
            'seed' => $matchData['player2_seed']
        ],
        'score' => [
            'player1Sets' => $matchData['p1_sets'],
            'player2Sets' => $matchData['p2_sets'],
            'player1Games' => $matchData['p1_games'],
            'player2Games' => $matchData['p2_games'],
            'player1Points' => $matchData['p1_points'],
            'player2Points' => $matchData['p2_points']
        ],
        'matchStatus' => $matchData['status'],
        'currentSet' => $matchData['current_set']
    ];
}

$matchId = $_GET['match'] ?? null;
echo json_encode(getScoreboardData($matchId));
?>
```

### Example Python Flask Implementation

```python
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/tennis/current')
def get_current_match():
    # Get data from your tennis application
    match_data = get_live_match_data()
    
    scoreboard_data = {
        'matchId': match_data['id'],
        'player1': {
            'name': match_data['player1']['name'],
            'country': match_data['player1'].get('country', ''),
            'seed': match_data['player1'].get('seed', 0)
        },
        'player2': {
            'name': match_data['player2']['name'],
            'country': match_data['player2'].get('country', ''),
            'seed': match_data['player2'].get('seed', 0)
        },
        'score': transform_score(match_data['score']),
        'matchStatus': match_data['status'],
        'currentSet': match_data['current_set']
    }
    
    return jsonify(scoreboard_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
```

---

## Component Binding

### Automatic Binding

The scoreboard automatically maps data to components:

| Component Type | Data Path | Description |
|---------------|-----------|-------------|
| Tennis Player Name | `player1.name` / `player2.name` | Player names |
| Tennis Country | `player1.country` / `player2.country` | Country codes |
| Tennis Game Score | `score.player1Games` / `score.player2Games` | Games in current set |
| Tennis Point Score | `score.player1Points` / `score.player2Points` | Current game points |
| Tennis Set Score | `score.player1Sets` / `score.player2Sets` | Sets won |
| Detailed Set Score | `sets.set1.player1` etc. | Individual set scores |
| Serve Speed | `serve.speed` | Last serve speed |

### Manual Binding Setup

1. Select a component on your scoreboard
2. In the **Properties Panel**, find **"Live Data Binding"**
3. Choose your connection
4. Select the appropriate **Data Path**
5. Set a **Fallback Value** for when no data is available

---

## Testing Integration

### 1. Test with Mock Data First

1. Create a live data connection with **Provider: "Mock"**
2. This generates sample tennis data to verify your scoreboard layout
3. Ensure all components display correctly

### 2. Test with Sample API Response

Create a simple test endpoint that returns static data:

```javascript
// test-endpoint.js
const express = require('express');
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/test-tennis', (req, res) => {
  res.json({
    matchId: "test_match_001",
    player1: { name: "Test Player 1", country: "USA", seed: 1 },
    player2: { name: "Test Player 2", country: "GBR", seed: 2 },
    score: {
      player1Sets: 1,
      player2Sets: 0, 
      player1Games: 3,
      player2Games: 2,
      player1Points: "30",
      player2Points: "15"
    },
    matchStatus: "in_progress",
    currentSet: 2
  });
});

app.listen(3000);
```

### 3. Validate Data Updates

1. Ensure data changes in your tennis app appear on the scoreboard
2. Check that animations work when scores change
3. Verify the polling interval is appropriate (default: 2 seconds)

---

## Troubleshooting

### Common Issues

#### ❌ "Connection Failed" Error
- **Check URL**: Ensure the API endpoint is accessible
- **Check CORS**: Add proper CORS headers to your API
- **Test manually**: Try accessing the URL in a browser

#### ❌ Components Show Fallback Values
- **Check data format**: Ensure JSON matches expected structure
- **Check field names**: Field names are case-sensitive
- **Check data types**: Numbers should be numbers, strings should be strings

#### ❌ No Animation on Score Changes
- **Check polling**: Ensure connection is actively polling
- **Check value changes**: Values must actually change to trigger animations
- **Check binding**: Ensure components are properly bound to data paths

#### ❌ Serve Speed Always Empty
- **Check data path**: Must be `serve.speed` exactly
- **Include units**: Speed should include "MPH" or "KMH"
- **Set fallback**: Use empty string as fallback to hide when no data

#### ❌ Firebase Connection Issues
- **Authentication errors**: Ensure Firebase rules allow public read access or use proper authentication
- **CORS errors**: Add proper CORS headers to Cloud Functions or use direct Firebase REST API
- **Function not found**: Check that Cloud Function is deployed and accessible
- **Data not updating**: Verify Firebase listeners are working and data is being written to correct paths

#### ❌ Firebase Data Format Issues
- **Nested data**: Firebase often stores data differently than expected - use transformation functions
- **Null values**: Firebase may return null for missing fields - use fallback values in transformation
- **Array vs Object**: Firebase converts arrays to objects with numeric keys - handle appropriately

### Debug Tools

#### Enable Console Logging
The scoreboard logs data updates to the browser console:
```javascript
// Look for these messages in browser dev tools:
"🎾 Tennis data updated for connection: your_connection_name"
"🎬 Animating tennis_game_score: 3 → 4 (score-increase)"
"⏭️ Skipping animation for tennis_player_name: Federer → Nadal"
```

#### Test API Response
Use browser dev tools or curl to test your API:
```bash
curl -H "Accept: application/json" http://your-api-url/endpoint
```

#### Check Data Structure
Use this JavaScript to validate your data structure:
```javascript
function validateTennisData(data) {
  const required = ['matchId', 'player1.name', 'player2.name', 'score.player1Sets'];
  const missing = [];
  
  required.forEach(path => {
    const value = path.split('.').reduce((obj, key) => obj && obj[key], data);
    if (value === undefined) missing.push(path);
  });
  
  if (missing.length > 0) {
    console.error('Missing required fields:', missing);
    return false;
  }
  return true;
}
```

---

## Example Integration Scenarios

### Scenario 1: Club Management Software
- **Data Source**: MySQL database with match tables
- **Integration**: PHP script queries database and formats JSON
- **Update Method**: Cron job updates JSON file every 5 seconds
- **Scoreboard Setup**: File-based polling connection

### Scenario 2: Tournament Software
- **Data Source**: Existing web application with admin panel
- **Integration**: Add new API endpoint to existing web app
- **Update Method**: Real-time WebSocket updates
- **Scoreboard Setup**: WebSocket connection with live updates

### Scenario 3: Mobile Scoring App
- **Data Source**: Mobile app with local SQLite database
- **Integration**: Local web server serves data from mobile device
- **Update Method**: HTTP polling every 2 seconds
- **Scoreboard Setup**: REST API connection to mobile device IP

### Scenario 4: Firebase-based Tennis App
- **Data Source**: Firebase Realtime Database or Firestore
- **Integration**: Firebase Cloud Function with HTTPS trigger
- **Update Method**: Real-time Firebase listeners with 2-second polling fallback
- **Scoreboard Setup**: REST API connection to Cloud Function URL
- **Example Setup**:
  ```
  Tennis App → Firebase Database → Cloud Function → Scoreboard
  https://us-central1-tennis-app.cloudfunctions.net/getScoreboardData
  ```

---

## Advanced Features

### Custom Data Transformations

For complex data sources, you can create a middleware service:

```javascript
// middleware-service.js
const express = require('express');
const axios = require('axios');

const app = express();

app.get('/scoreboard-data', async (req, res) => {
  try {
    // Fetch from your complex tennis system
    const response = await axios.get('http://your-tennis-app/api/complex-data');
    
    // Transform to scoreboard format
    const scoreboardData = await complexTransformation(response.data);
    
    res.json(scoreboardData);
  } catch (error) {
    res.status(500).json({ error: 'Data transformation failed' });
  }
});
```

### Multiple Match Support

To support multiple simultaneous matches:

```javascript
// Return array of matches
app.get('/api/tennis/matches', (req, res) => {
  const matches = getAllLiveMatches();
  const scoreboardMatches = matches.map(transformToScoreboardFormat);
  res.json(scoreboardMatches);
});

// Individual match endpoint
app.get('/api/tennis/match/:id', (req, res) => {
  const match = getMatchById(req.params.id);
  res.json(transformToScoreboardFormat(match));
});
```

---

## Support

For additional help with integration:

1. **Check the mock data**: Use the built-in mock provider to understand expected data format
2. **Test incrementally**: Start with static data, then add real-time updates
3. **Use browser dev tools**: Monitor network requests and console logs
4. **Validate JSON**: Ensure your API returns valid JSON

Remember: The key to successful integration is matching the exact data structure and field names expected by the scoreboard system.