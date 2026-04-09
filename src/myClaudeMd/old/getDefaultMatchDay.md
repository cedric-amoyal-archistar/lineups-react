Use the team of agents to plan, show me plan and then execute using the team of agents. ( mode: "acceptEdits" )
Create or update tests at the end of the task if relevant.

Analyse src/providers/ligue1/index.ts and other "Ligue 1" specific file/logic

getDefaultGameweek and findActiveGameweek and other logic that helps to define the defaultGameWeek will be similar for the other competitions that we will create soon that have the gameWeek logic (like the Premier Ligue or La Liga)

I am just wondering if you should extract that logic or dulicate it for each competion.
Other piece of logic in "src/providers/ligue1/index.ts and other "Ligue 1" specific file/logic" might also not be "Ligue 1" specific, in that case might be extracted too. What do you think?
