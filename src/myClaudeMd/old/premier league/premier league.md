Use the team of agents to plan, show me plan and then execute using the team of agents. ( mode: "acceptEdits" )
Create or update tests at the end of the task if relevant.
You can run all the command to search the web or search the code without asking me.
Just don't do any git command.

Create Premier League Competition (Top English League)
Analyse carefully the "Ligue 1" providers because the Premier league one will have similar logic. Same type of competion with gameWeek logic.

Let's bring the Premier League competition
Official website "https://www.premierleague.com/en"

For the current season you get a gameWeek with this type of url:
"https://www.premierleague.com/en/matches/premier-league/2025-26/matchweek-32"

This api call gets you the games for that gameWeek
"Request URL
https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v1/competitions/8/seasons/2025/matchweeks/32/matches?_limit=20
Request Method
GET"

You should analyse the api call response.
Let me know if you need me to paste it or if you can find it yourself

To get the details for a specific game you go to this page:
"https://www.premierleague.com/en/match/2562195/bournemouth-vs-manchester-united/overview"


The api call that gives you the details is:
"Request URL
https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v2/matches/2562195
Request Method
GET"
Analyse the response format for the details

They also have a lineup endpoint:di
"Request URL
https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v3/matches/2562195/lineups
Request Method
GET"
Analyse the response format for the lineup
The logic is different from the one of the other competitions.

The api call that gives you the squad details is:
"Request URL
https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v2/competitions/8/seasons/2025/teams/1/squad
Request Method
GET"

The api call that gives you the events details is:
"Request URL
https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v1/matches/2562195/events
Request Method
GET"

The api call that gives you the players photo seems to be:
"Request URL
https://resources.premierleague.com/premierleague25/photos/players/40x40/496208.png
Request Method
GET"

You should analyse the api calls and their responses.
There are many api calls for this competition. You will have to be well organised and write the Premier League provider carefully.
Make sure you do code review and test things.



