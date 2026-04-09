Use the team of agents to plan, show me plan and then execute using the team of agents. ( mode: "acceptEdits" )
Create or update tests at the end of the task if relevant.

Analyse carefully src/components/match/MatchCard.tsx and the providers for each competition.

I want to improve the layout and the details displayed on the match card for all the competitions.

New in details needed:
- youtube video link (research the web and the best way to get the youtube url for a specific match) (be aware that the same team my play each other often, we want the correct video url not the one from a match that happenened  another day) (I am not sure how many minutes/hours after the end of the match the video becomes available, you will have to research it)
- minutes (for Live matches) (data should be available from the api calls we already trigger to get the match list and the matches details, if not available for a competition let me know)

You can see on the multiple screenshots the different layout options depending on the match status:
(chronological order)
- 1) Match in the future: src/myClaudeMd/matchCard/Match in the futur.png
- 2) Match tomorrow: src/myClaudeMd/matchCard/Match Tomorrow.png
- 3) Match Live with minutes: src/myClaudeMd/matchCard/Match Live with Minutes.png
- 4) Match FT today: src/myClaudeMd/matchCard/Match FT today.png
- 4bis) Match FT but video not available. I don't have  ascreenshot but we might have to handle that case too
- 5) Match FT with video: src/myClaudeMd/matchCard/Match FT with video.png

Do not change the UI (background, color, ...) just move things around to match the new layout (see screenshots)


