in the list of matches endpoint:

Request URL
https://match.uefa.com/v5/matches?matchId=2048137
Request Method
GET

see image src/myClaudeMd/minuteUEFA/minuteList.png
The minute format should be:
minute: {normal: 86}

in the matche details endpoint:
see image src/myClaudeMd/minuteUEFA/minuteDetails.png
The minute format should be:
minute: {normal: 90}

at this time the minute feature doesn't work for the competions using src/providers/uefa/index.ts
can you analyse that file and fix based on the info wriiten above
