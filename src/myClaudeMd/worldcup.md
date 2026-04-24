Use the team of agents to plan, show me plan and then execute using the team of agents. ( mode: "acceptEdits" )

Analyse carefully the repo.

Our main feature is to show the matches lineup and to display the national flag for the players.
This way when PSG plays we can see how many players are French, Portguese, Brazilians ect ... and where they play on the pitch.
This we do well for many competitions already: Ligue 1, Premier League and UCL/UEL/UECL.

For the next soccer world cup (and for the previous worlcup if possible) I want to do it the other way around.
For the French team for example it would be good to see what players play for PSG, Barcelona, Chelsea ect .. ... and where they play on the pitch.
so to display the team logo instead of the national flag.

The offial website must be:
https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026
You can find the scores and fixtures here:
https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=AU&wtw-filter=ALL

For the previous world cup you can find the scores and fixtures here:
https://www.fifa.com/en/tournaments/mens/worldcup/qatar2022/scores-fixtures?country=AU&wtw-filter=ALL
You can find the match details on url like this:
https://www.fifa.com/en/match-centre/match/17/255711/285063/400128082
Endpoints like this gives you some data:
Request URL
https://api.fifa.com/api/v3/live/football/400128082?language=en
Request Method
GET
This si where they get the match info and the lineup
As you can see in the lineup tab it is not a real lineup on a pitch like we do
And it looks like the data doesn't tell us in what team the players play this year (PSG, Chelsea, Barcelona,...)

Can you search the fifa website and see what data you can find?
Can you look at the endpoint above and the data returned to see what we get?

If any data is missing, can you search the web and see what website is displaying this data (I might be able to open the network tab and see if we can use their endpoints, similar to what we do already)
