import Redis from 'ioredis';

const redisClient:Redis = new Redis({
	host: process.env.REDIS_HOST,
	port: process.env.REDIS_PORT as unknown as number,
	username: 'default',
	password: process.env.REDIS_PASSWORD
});
redisClient.on('connect', ()=>{
	console.log('Connected to Redis');
})
redisClient.on('error', (err:any)=>{
	console.log('Error in Redis Connection', err);
})

export default redisClient;
