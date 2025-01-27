IMAGE: node:latest

CMD: 			node --no-deprecation /usr/src/app/server.js
CMD:			'node' '--no-deprecation' '/usr/src/app/server.js'
ENTRYPOINT: 	docker-entrypoint.sh
ENTRYPOINT: 	'docker-entrypoint.sh'

WORKING DIR:	/usr/src/app

VOLUME MAPPING: "/Users/darren/Docker/isengine" - "/usr/src/app".

NETWORK: internal.
HOSTNAME: isidentity.
IPv4 Address: 172.18.0.18

ENV: HOME - s

RESTART POLICY: UNLESS STOPPED.