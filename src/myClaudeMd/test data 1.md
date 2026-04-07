Many things can vary when it comes to data and format of the data:

- multiple competitions
- multiple seasons
- multiple gameWeeks (optional)
- multiple type of lineups logic
- different data format

I want you to write tests that tests for each competion the first season, the current season, and randomly pick 1 season every 10 years (example: 1 in between 1990 and 2000, 1 between 2000 and 2010 , 1 between 2010 and 2020, ...)
Also pick randomly 5 games in that seasons. Or 5 games within 5 gameweeks (when game week is relevant)

test the data, make sure that it returns everything we need to display the data properly and if some not critical data is missing (like player height) make sure that we have a fallback and that the app doesn't break.

Let's start by writing a list of critical data items and a list of optional data items. Once we agree on what is critical or not we can start to write test.

If some critical data is missing we need to deicide what to do, not sure yet. It will be a case by case.

Use the all the relevants agents to plan that task properly.
Show me the plan, this way I can comment and approve.
