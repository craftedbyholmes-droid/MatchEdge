-- World Cup 2026 - Verified fixtures from Al Jazeera / Yahoo Sports May 2026
-- Clear existing data
DELETE FROM wc_matches;
DELETE FROM wc_teams;
DELETE FROM wc_groups;

-- Groups
INSERT INTO wc_groups (group_id, group_name) VALUES
('A','Group A'),('B','Group B'),('C','Group C'),('D','Group D'),
('E','Group E'),('F','Group F'),('G','Group G'),('H','Group H'),
('I','Group I'),('J','Group J'),('K','Group K'),('L','Group L');

-- Teams
INSERT INTO wc_teams (team_id, name, group_id, confederation, played, wins, draws, losses, goals_for, goals_against, points) VALUES
('MEX','Mexico','A','CONCACAF',0,0,0,0,0,0,0),
('RSA','South Africa','A','CAF',0,0,0,0,0,0,0),
('KOR','South Korea','A','AFC',0,0,0,0,0,0,0),
('CZE','Czechia','A','UEFA',0,0,0,0,0,0,0),
('CAN','Canada','B','CONCACAF',0,0,0,0,0,0,0),
('BIH','Bosnia and Herzegovina','B','UEFA',0,0,0,0,0,0,0),
('QAT','Qatar','B','AFC',0,0,0,0,0,0,0),
('SUI','Switzerland','B','UEFA',0,0,0,0,0,0,0),
('BRA','Brazil','C','CONMEBOL',0,0,0,0,0,0,0),
('MAR','Morocco','C','CAF',0,0,0,0,0,0,0),
('HTI','Haiti','C','CONCACAF',0,0,0,0,0,0,0),
('SCO','Scotland','C','UEFA',0,0,0,0,0,0,0),
('USA','United States','D','CONCACAF',0,0,0,0,0,0,0),
('PAR','Paraguay','D','CONMEBOL',0,0,0,0,0,0,0),
('AUS','Australia','D','AFC',0,0,0,0,0,0,0),
('TUR','Turkiye','D','UEFA',0,0,0,0,0,0,0),
('GER','Germany','E','UEFA',0,0,0,0,0,0,0),
('CUW','Curacao','E','CONCACAF',0,0,0,0,0,0,0),
('CIV','Ivory Coast','E','CAF',0,0,0,0,0,0,0),
('ECU','Ecuador','E','CONMEBOL',0,0,0,0,0,0,0),
('NED','Netherlands','F','UEFA',0,0,0,0,0,0,0),
('JPN','Japan','F','AFC',0,0,0,0,0,0,0),
('SWE','Sweden','F','UEFA',0,0,0,0,0,0,0),
('TUN','Tunisia','F','CAF',0,0,0,0,0,0,0),
('BEL','Belgium','G','UEFA',0,0,0,0,0,0,0),
('EGY','Egypt','G','CAF',0,0,0,0,0,0,0),
('IRN','Iran','G','AFC',0,0,0,0,0,0,0),
('NZL','New Zealand','G','OFC',0,0,0,0,0,0,0),
('ESP','Spain','H','UEFA',0,0,0,0,0,0,0),
('CPV','Cape Verde','H','CAF',0,0,0,0,0,0,0),
('SAU','Saudi Arabia','H','AFC',0,0,0,0,0,0,0),
('URU','Uruguay','H','CONMEBOL',0,0,0,0,0,0,0),
('FRA','France','I','UEFA',0,0,0,0,0,0,0),
('SEN','Senegal','I','CAF',0,0,0,0,0,0,0),
('IRQ','Iraq','I','AFC',0,0,0,0,0,0,0),
('NOR','Norway','I','UEFA',0,0,0,0,0,0,0),
('ARG','Argentina','J','CONMEBOL',0,0,0,0,0,0,0),
('ALG','Algeria','J','CAF',0,0,0,0,0,0,0),
('AUT','Austria','J','UEFA',0,0,0,0,0,0,0),
('JOR','Jordan','J','AFC',0,0,0,0,0,0,0),
('POR','Portugal','K','UEFA',0,0,0,0,0,0,0),
('COD','DR Congo','K','CAF',0,0,0,0,0,0,0),
('UZB','Uzbekistan','K','AFC',0,0,0,0,0,0,0),
('COL','Colombia','K','CONMEBOL',0,0,0,0,0,0,0),
('ENG','England','L','UEFA',0,0,0,0,0,0,0),
('CRO','Croatia','L','UEFA',0,0,0,0,0,0,0),
('GHA','Ghana','L','CAF',0,0,0,0,0,0,0),
('PAN','Panama','L','CONCACAF',0,0,0,0,0,0,0);

-- Group Stage Fixtures (all verified from Al Jazeera/Yahoo Sports May 2026)
-- Times stored as UTC
INSERT INTO wc_matches (match_id, stage, group_id, home_team, away_team, home_team_id, away_team_id, kickoff_time, venue, city, status) VALUES
-- June 11
('WC001','group','A','Mexico','South Africa','MEX','RSA','2026-06-11T21:00:00Z','Mexico City Stadium','Mexico City','scheduled'),
('WC002','group','A','South Korea','Czechia','KOR','CZE','2026-06-12T04:00:00Z','Estadio Guadalajara','Guadalajara','scheduled'),
-- June 12
('WC003','group','B','Canada','Bosnia and Herzegovina','CAN','BIH','2026-06-12T20:00:00Z','Toronto Stadium','Toronto','scheduled'),
('WC004','group','D','United States','Paraguay','USA','PAR','2026-06-13T05:00:00Z','Los Angeles Stadium','Los Angeles','scheduled'),
-- June 13
('WC005','group','B','Qatar','Switzerland','QAT','SUI','2026-06-13T23:00:00Z','San Francisco Bay Area Stadium','San Francisco','scheduled'),
('WC006','group','C','Brazil','Morocco','BRA','MAR','2026-06-13T23:00:00Z','New York New Jersey Stadium','New Jersey','scheduled'),
('WC007','group','C','Haiti','Scotland','HTI','SCO','2026-06-14T02:00:00Z','Boston Stadium','Boston','scheduled'),
('WC008','group','D','Australia','Turkiye','AUS','TUR','2026-06-14T08:00:00Z','BC Place','Vancouver','scheduled'),
-- June 14
('WC009','group','E','Germany','Curacao','GER','CUW','2026-06-14T19:00:00Z','Houston Stadium','Houston','scheduled'),
('WC010','group','F','Netherlands','Japan','NED','JPN','2026-06-14T22:00:00Z','Dallas Stadium','Dallas','scheduled'),
('WC011','group','E','Ivory Coast','Ecuador','CIV','ECU','2026-06-15T00:00:00Z','Philadelphia Stadium','Philadelphia','scheduled'),
('WC012','group','F','Sweden','Tunisia','SWE','TUN','2026-06-15T04:00:00Z','Estadio Monterrey','Monterrey','scheduled'),
-- June 15
('WC013','group','H','Spain','Cape Verde','ESP','CPV','2026-06-15T17:00:00Z','Atlanta Stadium','Atlanta','scheduled'),
('WC014','group','G','Belgium','Egypt','BEL','EGY','2026-06-15T23:00:00Z','BC Place','Vancouver','scheduled'),
('WC015','group','H','Saudi Arabia','Uruguay','SAU','URU','2026-06-15T23:00:00Z','Miami Stadium','Miami','scheduled'),
('WC016','group','G','Iran','New Zealand','IRN','NZL','2026-06-16T05:00:00Z','Los Angeles Stadium','Los Angeles','scheduled'),
-- June 16
('WC017','group','I','France','Senegal','FRA','SEN','2026-06-16T20:00:00Z','New York New Jersey Stadium','New Jersey','scheduled'),
('WC018','group','I','Iraq','Norway','IRQ','NOR','2026-06-16T23:00:00Z','Boston Stadium','Boston','scheduled'),
('WC019','group','J','Argentina','Algeria','ARG','ALG','2026-06-17T03:00:00Z','Kansas City Stadium','Kansas City','scheduled'),
('WC020','group','J','Austria','Jordan','AUT','JOR','2026-06-17T08:00:00Z','San Francisco Bay Area Stadium','San Francisco','scheduled'),
-- June 17
('WC021','group','K','Portugal','DR Congo','POR','COD','2026-06-17T19:00:00Z','Houston Stadium','Houston','scheduled'),
('WC022','group','L','England','Croatia','ENG','CRO','2026-06-17T22:00:00Z','Dallas Stadium','Dallas','scheduled'),
('WC023','group','L','Ghana','Panama','GHA','PAN','2026-06-18T00:00:00Z','Toronto Stadium','Toronto','scheduled'),
('WC024','group','K','Uzbekistan','Colombia','UZB','COL','2026-06-18T04:00:00Z','Mexico City Stadium','Mexico City','scheduled'),
-- June 18
('WC025','group','A','Czechia','South Africa','CZE','RSA','2026-06-18T17:00:00Z','Atlanta Stadium','Atlanta','scheduled'),
('WC026','group','B','Switzerland','Bosnia and Herzegovina','SUI','BIH','2026-06-18T23:00:00Z','Los Angeles Stadium','Los Angeles','scheduled'),
('WC027','group','B','Canada','Qatar','CAN','QAT','2026-06-19T02:00:00Z','BC Place','Vancouver','scheduled'),
('WC028','group','A','Mexico','South Korea','MEX','KOR','2026-06-19T03:00:00Z','Estadio Guadalajara','Guadalajara','scheduled'),
-- June 19
('WC029','group','D','USA','Australia','USA','AUS','2026-06-19T23:00:00Z','Seattle Stadium','Seattle','scheduled'),
('WC030','group','C','Scotland','Morocco','SCO','MAR','2026-06-19T23:00:00Z','Boston Stadium','Boston','scheduled'),
('WC031','group','C','Brazil','Haiti','BRA','HTI','2026-06-20T02:00:00Z','Philadelphia Stadium','Philadelphia','scheduled'),
('WC032','group','D','Turkiye','Paraguay','TUR','PAR','2026-06-20T08:00:00Z','San Francisco Bay Area Stadium','San Francisco','scheduled'),
-- June 20
('WC033','group','F','Netherlands','Sweden','NED','SWE','2026-06-20T19:00:00Z','Houston Stadium','Houston','scheduled'),
('WC034','group','E','Germany','Ivory Coast','GER','CIV','2026-06-20T21:00:00Z','Toronto Stadium','Toronto','scheduled'),
('WC035','group','E','Ecuador','Curacao','ECU','CUW','2026-06-21T04:00:00Z','Kansas City Stadium','Kansas City','scheduled'),
('WC036','group','F','Tunisia','Japan','TUN','JPN','2026-06-21T06:00:00Z','Estadio Monterrey','Monterrey','scheduled'),
-- June 21
('WC037','group','H','Spain','Saudi Arabia','ESP','SAU','2026-06-21T17:00:00Z','Atlanta Stadium','Atlanta','scheduled'),
('WC038','group','G','Belgium','Iran','BEL','IRN','2026-06-21T23:00:00Z','Los Angeles Stadium','Los Angeles','scheduled'),
('WC039','group','H','Uruguay','Cape Verde','URU','CPV','2026-06-21T23:00:00Z','Miami Stadium','Miami','scheduled'),
('WC040','group','G','New Zealand','Egypt','NZL','EGY','2026-06-22T05:00:00Z','BC Place','Vancouver','scheduled'),
-- June 22
('WC041','group','J','Argentina','Austria','ARG','AUT','2026-06-22T19:00:00Z','Dallas Stadium','Dallas','scheduled'),
('WC042','group','I','France','Iraq','FRA','IRQ','2026-06-22T22:00:00Z','Philadelphia Stadium','Philadelphia','scheduled'),
('WC043','group','I','Norway','Senegal','NOR','SEN','2026-06-23T01:00:00Z','New York New Jersey Stadium','New Jersey','scheduled'),
('WC044','group','J','Jordan','Algeria','JOR','ALG','2026-06-23T07:00:00Z','San Francisco Bay Area Stadium','San Francisco','scheduled'),
-- June 23
('WC045','group','K','Portugal','Uzbekistan','POR','UZB','2026-06-23T19:00:00Z','Houston Stadium','Houston','scheduled'),
('WC046','group','L','England','Ghana','ENG','GHA','2026-06-23T21:00:00Z','Boston Stadium','Boston','scheduled'),
('WC047','group','L','Panama','Croatia','PAN','CRO','2026-06-24T00:00:00Z','Toronto Stadium','Toronto','scheduled'),
('WC048','group','K','Colombia','DR Congo','COL','COD','2026-06-24T04:00:00Z','Estadio Guadalajara','Guadalajara','scheduled'),
-- June 24
('WC049','group','B','Switzerland','Canada','SUI','CAN','2026-06-24T23:00:00Z','BC Place','Vancouver','scheduled'),
('WC050','group','B','Bosnia and Herzegovina','Qatar','BIH','QAT','2026-06-24T23:00:00Z','Seattle Stadium','Seattle','scheduled'),
('WC051','group','C','Scotland','Brazil','SCO','BRA','2026-06-24T23:00:00Z','Miami Stadium','Miami','scheduled'),
('WC052','group','C','Morocco','Haiti','MAR','HTI','2026-06-24T23:00:00Z','Atlanta Stadium','Atlanta','scheduled'),
('WC053','group','A','Czechia','Mexico','CZE','MEX','2026-06-25T03:00:00Z','Mexico City Stadium','Mexico City','scheduled'),
('WC054','group','A','South Africa','South Korea','RSA','KOR','2026-06-25T03:00:00Z','Estadio Monterrey','Monterrey','scheduled'),
-- June 25
('WC055','group','E','Ecuador','Germany','ECU','GER','2026-06-25T21:00:00Z','New York New Jersey Stadium','New Jersey','scheduled'),
('WC056','group','E','Curacao','Ivory Coast','CUW','CIV','2026-06-25T21:00:00Z','Philadelphia Stadium','Philadelphia','scheduled'),
('WC057','group','F','Japan','Sweden','JPN','SWE','2026-06-26T01:00:00Z','Dallas Stadium','Dallas','scheduled'),
('WC058','group','F','Tunisia','Netherlands','TUN','NED','2026-06-26T01:00:00Z','Kansas City Stadium','Kansas City','scheduled'),
('WC059','group','D','Turkiye','USA','TUR','USA','2026-06-26T06:00:00Z','Los Angeles Stadium','Los Angeles','scheduled'),
('WC060','group','D','Paraguay','Australia','PAR','AUS','2026-06-26T06:00:00Z','San Francisco Bay Area Stadium','San Francisco','scheduled'),
-- June 26
('WC061','group','I','Norway','France','NOR','FRA','2026-06-26T20:00:00Z','Boston Stadium','Boston','scheduled'),
('WC062','group','I','Senegal','Iraq','SEN','IRQ','2026-06-26T20:00:00Z','Toronto Stadium','Toronto','scheduled'),
('WC063','group','H','Cape Verde','Saudi Arabia','CPV','SAU','2026-06-27T02:00:00Z','Houston Stadium','Houston','scheduled'),
('WC064','group','H','Uruguay','Spain','URU','ESP','2026-06-27T02:00:00Z','Estadio Guadalajara','Guadalajara','scheduled'),
('WC065','group','G','Egypt','Iran','EGY','IRN','2026-06-27T07:00:00Z','Seattle Stadium','Seattle','scheduled'),
('WC066','group','G','New Zealand','Belgium','NZL','BEL','2026-06-27T07:00:00Z','BC Place','Vancouver','scheduled'),
-- June 27
('WC067','group','L','Panama','England','PAN','ENG','2026-06-27T22:00:00Z','New York New Jersey Stadium','New Jersey','scheduled'),
('WC068','group','L','Croatia','Ghana','CRO','GHA','2026-06-27T22:00:00Z','Philadelphia Stadium','Philadelphia','scheduled'),
('WC069','group','K','Colombia','Portugal','COL','POR','2026-06-28T02:30:00Z','Miami Stadium','Miami','scheduled'),
('WC070','group','K','DR Congo','Uzbekistan','COD','UZB','2026-06-28T02:30:00Z','Atlanta Stadium','Atlanta','scheduled'),
('WC071','group','J','Algeria','Austria','ALG','AUT','2026-06-28T04:00:00Z','Kansas City Stadium','Kansas City','scheduled'),
('WC072','group','J','Jordan','Argentina','JOR','ARG','2026-06-28T04:00:00Z','Dallas Stadium','Dallas','scheduled');

SELECT COUNT(*) as matches FROM wc_matches;
SELECT COUNT(*) as teams FROM wc_teams;
SELECT COUNT(*) as groups FROM wc_groups;