Use the team of agents to plan, show me plan and then execute using the team of agents. ( mode: "acceptEdits" )
Create or update tests at the end of the task if relevant.

Create Premier Leagu Competition (Top English League)
Analyse carefully the "Ligue 1" providers because the Premier league one will have similar logic. Same type of competion with gameWeek logic.

Let's bring the Ligue 1 competition.ne
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


???????????????
The api call that gives you the details is:
"Request URL
https://ma-api.ligue1.fr/championship-match/l1_championship_match_73367
Request Method
GET"

You should analyse the api call response.
Let me know if you need me to paste it or if you can find it yourself

Look at the lineup images they do it horizontally on large screen and vertically on mobile (we want vertically)
I feel like they are using "formationPlace" do decide where the player should be on the pitch but you will have to carefully read and understand all the data to confirm and take the best decision.
The data format as well as the lineup logic is very different from the one from the UEFA website so you will have to take your time and plan properly.

For the competion like ligue 1 that have a gameWeek logic (so the usual National Leagues (different for champions league that is a tournament)), you will have to add a gameWeek selector (be aware that the number of game weeks varies with seasons and leagues). The default value should be the in progress one or the next one.
