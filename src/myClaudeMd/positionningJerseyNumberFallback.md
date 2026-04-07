Use the team of agents to plan, show me plan and then execute using the team of agents. ( mode: "acceptEdits" )

The current logic to display the players on the pitch is:

1. Data Source (Provider Layer)
2. Formation-Based Coordinate Synthesis (Ligue 1)
3. Invalid Coordinate Fallback (UEFA legacy)
4. Default to Midfielder

We need to add an extra item see new item below:

1. Data Source (Provider Layer)
2. Formation-Based Coordinate Synthesis (Ligue 1)
3. Invalid Coordinate Fallback (UEFA legacy)
4. (NEW) Use JerseY Number for positionning
5. Default to Midfielder

(NEW) Use JerseY Number for positionning:
Historically the jersey number were link to the player position on the pitch. Use similar logic than the "Ligue 1" logic, assume formation is 442, and formationPlace is jerseyNumber (1 to 11, withh 12 same as 1, 13 same as 2, 14 same as 3 ..), build coordinates, then position the players on the pitch using those positions.

Create similar logic than the "Ligue 1" logic but keep it independent.

Once useJerseyNumberForLineup function is ready, integrate it:
Create independent function and integrate with current logic using simple if, else if, else statement that I can easily review and understand

Create new test if needed
