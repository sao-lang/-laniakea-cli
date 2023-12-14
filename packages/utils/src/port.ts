import net from 'net';
export const checkPortIsUsed = (port: number) => {
    return new Promise((resolve: (value: boolean) => void) => {
        const server = net.createServer().listen(port);
        server.on('listening', () => {
            server.close();
            resolve(true);
        });
        server.on('error', (err) => {
            if (err) {
                resolve(false);
            }
        });
    });
};

export const getAnAvailablePort = async (port: number) => {
    while (!(await checkPortIsUsed(port))) {
        port++;
    }
    return port;
};

export default checkPortIsUsed;
