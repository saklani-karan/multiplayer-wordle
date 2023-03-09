import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { MainLayout } from "../../layouts/MainLayout";
import { client } from "../../utils";
import { useUserAuthContext } from "../../context/UserAuthProvider";
import { BlockOptions } from "../../components/form";
import { over } from "stompjs";
import SockJS from "sockjs-client";
import { Check } from "../../icons";

let stompClient = null;
export default function Room() {
    const router = useRouter();
    const authContext = useUserAuthContext();
    const [roomData, setRoomData] = useState({
        room: null,
        isAdmin: false,
        readyToStart: false,
        isReady: false,
    });
    const [room, setRoom] = useState(null);
    const [user, setUser] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [gameSettings, setGameSettings] = useState({
        numberRounds: 1,
        roundMode: "TIME_BASED",
    });
    const [roomNotFound, setRoomNotFound ] = useState(false);

    const getRoom = async () => {
        const query = router.query;
        if (query?.id && authContext.getToken()) {
            try {
                const { prevRoom, roomUserData, roomCreationValidation } =
                    await getRoomData({});
                const prevRoomData = {
                    room: prevRoom,
                    isAdmin: roomUserData?.isAdmin,
                    isReady: roomUserData?.isReady,
                    readyToStart: roomCreationValidation?.success,
                };
                setUser(authContext.getUser());
                setRoomData(prevRoomData);
            } catch (err) {
                setRoomNotFound(true);
            }
        }
    };

    const getRoomData = async ({
        fetchRoom = true,
        fetchRoomUser = true,
        fetchRoomCreationValidation = true,
    }) => {
        const query = router.query;
        const [prevRoom, roomUserData, roomCreationValidation] =
            await Promise.all([
                fetchRoom
                    ? await client(
                          `${process.env.NEXT_PUBLIC_API_URL}/rooms/${query.id}`,
                          {
                              mode: "cors",
                              headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${authContext.getToken()}`,
                              },
                          }
                      )
                    : null,
                fetchRoomUser
                    ? await client(
                          `${process.env.NEXT_PUBLIC_API_URL}/rooms/${query.id}/me`,
                          {
                              mode: "cors",
                              headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${authContext.getToken()}`,
                              },
                          }
                      )
                    : null,
                fetchRoomCreationValidation
                    ? await client(
                          `${process.env.NEXT_PUBLIC_API_URL}/rooms/${query.id}/validateGameCreation`,
                          {
                              mode: "cors",
                              headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${authContext.getToken()}`,
                              },
                          }
                      )
                    : null,
            ]);
        return {
            prevRoom,
            roomUserData,
            roomCreationValidation,
        };
    };

    const connect = () => {
        let Sock = new SockJS(process.env.NEXT_PUBLIC_WS_URL);
        stompClient = over(Sock);
        stompClient.connect({}, onConnected, onError);
    };

    const userJoin = () => {
        const chatMessage = {
            userId: user?.id,
            roomId: roomData?.room?.id,
            status: "JOIN",
        };
        stompClient.send("/app/room/join", {}, JSON.stringify(chatMessage));
    };

    const toggleReadyStatus = () => {
        const chatMessage = {
            userId: user?.id,
            roomId: roomData?.room?.id,
            status: roomData.isReady ? "NOT_READY" : "READY",
        };
        stompClient.send(
            "/app/room/statusUpdate",
            {},
            JSON.stringify(chatMessage)
        );
    };

    const onConnected = () => {
        setTimeout(function () {
            stompClient.subscribe(
                "/room/" + roomData?.room?.id + "/user_join",
                onRoomJoinMessage
            );
            stompClient.subscribe(
                "/room/" + roomData?.room?.id + "/user_status_update",
                onUserStatusUpdate
            );
            stompClient.subscribe(
                "/room/" + roomData?.room?.id + "/game_created",
                onGameCreation
            );
            setIsConnected(true);
            userJoin();
        }, 500);
    };

    const onGameCreation = (payload) => {
        const message = JSON.parse(payload.body);
        const { gameId, roomId } = message;
        router.push(`/game/${gameId}`);
    };

    const onRoomJoinMessage = (payload) => {
        const message = JSON.parse(payload.body);
        switch (message?.status) {
            case "JOIN":
                handleUserJoin(message);
                break;
            default:
                console.log("unhandled message received");
        }
    };

    const onUserStatusUpdate = async (payload) => {
        const message = JSON.parse(payload.body);
        const { prevRoom, roomUserData, roomCreationValidation } =
            await getRoomData({});
        const prevRoomData = {
            ...roomData,
            room: prevRoom,
            isReady: roomUserData?.isReady,
            readyToStart: roomCreationValidation?.success,
        };
        setRoomData(prevRoomData);
    };

    const handleUserJoin = async ({ userId }) => {
        if (userId === user?.id) {
            return;
        }
        const { prevRoom, roomCreationValidation } = await getRoomData({
            fetchRoomUser: false,
        });
        const prevRoomData = {
            ...roomData,
            room: prevRoom,
            readyToStart: roomCreationValidation?.success,
        };
        setRoomData(prevRoomData);
    };

    const onError = (err) => {
        console.log(err);
    };
    const handleFormEntry = (label, value) => {
        const prevSettings = { ...gameSettings };
        setGameSettings({
            ...prevSettings,
            [label]: value,
        });
    };

    const createGame = async () => {
        try {
            const game = await client(
                `${process.env.NEXT_PUBLIC_API_URL}/games/create`,
                {
                    mode: "cors",
                    method: "post",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authContext.getToken()}`,
                    },
                    body: JSON.stringify({
                        ...gameSettings,
                        roomId: roomData?.room?.id,
                    }),
                }
            );
            stompClient.send(
                "/app/room/gameCreated",
                {},
                JSON.stringify({ roomId: roomData?.room?.id, gameId: game?.id })
            );
            router.push(`/game/${game?.id}`);
        } catch (err) {}
    };

    const handleRoomJoin = async () => {
        const query = router.query;
        try {
            const room = await client(
                `${process.env.NEXT_PUBLIC_API_URL}/rooms/${query.id}/admit`,
                {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authContext.getToken()}`,
                    },
                }
            );
            router.push(`/room/${room.roomId}`);
        } catch (err) {
            toast.error(
                "An error occured while joining the room, please try again"
            );
        }
    };

    useEffect(() => {
        getRoom();
    }, [router.query, authContext.getToken()]);

    useEffect(() => {
        if (user && roomData && !isConnected) {
            connect();
        }
    }, [user, roomData]);

    return (
        <MainLayout>
            {!roomData?.room ? (
                <div>
                    {
                    roomNotFound? 
                    <div className="flex-col flex space-y-6 p-4">
                        <div className="flex justify-center items-center">
                            <img src="/waiting.gif" className="w-52" />
                        </div>
                        <div className="flex flex-col justify-center items-center">
                            <p className="font-semibold font-raleway text-2xl text-black">Oops!</p>
                            <p className="font-light font-raleway text-lg text-gray-700"> You are not a member of this room</p>
                        </div>
                        <div className="flex flex-col justify-center items-center space-y-4">
                            <button className="rounded-full bg-green-50 border border-green-600 text-green-600 p-4 font-raleway w-2/3" onClick={handleRoomJoin}>Join Room</button>
                            <button className="rounded-full bg-red-50 border border-red-600 text-red-600 p-4 font-raleway w-2/3">Return To Main Menu</button>
                        </div>
                    </div> : null}
                </div>
                
            ) : (
                <div className="flex-col flex space-y-6 relatice">
                    <div className="flex-col flex space-y-2 px-4">
                        <div className="flex flex-col space-y-2 px-2">
                            <p className="items-center text-gray-700 text-lg font-raleway font-semibold">Room members</p>
                            <div className="flex flex-col space-y-2">
                                { roomData?.room?.users?.map((user)=>{
                                    const roomUser = user?.user;
                                    const userStatus = user?.status;
                                    const userRole = user?.role;

                                    return <div className="flex items-center justify-between">
                                        <div className="flex space-x-3 items-center">
                                            <img className="w-8 h-8 rounded-full" src={roomUser.picture}/>
                                            <div className="flex flex-col">
                                                <p className="font-raleway text-black">{roomUser.name}</p>
                                                <p className="font-raleway text-xs text-black font-light">{roomUser.email}</p>
                                            </div>
                                        </div>
                                        { userStatus === "READY" ? 
                                            <div className="flex justify-center items-center space-x-2">
                                                <span className="bg-green-300 w-3 h-3 rounded-full"></span>
                                                <p className="font-raleway text-green-700 text-sm ">Ready</p>
                                            </div>: 
                                            <div className="flex justify-center items-center space-x-2">
                                                <span className="bg-red-300 w-3 h-3 rounded-full"></span>
                                                <p className="font-raleway text-red-700 text-sm">Not Ready</p>
                                            </div>
                                        }
                                        
                                    </div>
                                })}
                            </div>
                        </div>
                    </div>
                    {roomData?.isAdmin ? (
                        <div className="flex-col flex space-y-2 px-6">
                            <div className="flex items-center text-lg font-semibold text-gray-700 font-raleway">
                                Configure
                            </div>
                            <div className="flex flex-col space-y-4">
                                <div className="flex flex-col justify-center space-y-1">
                                    <p className="text-gray-700 font-light">Rounds</p>
                                    <BlockOptions
                                        options={[
                                            { key: 1, value: 1 },
                                            { key: 3, value: 3 },
                                            { key: 5, value: 5 },
                                        ]}
                                        label="numberRounds"
                                        handleFormEntry={handleFormEntry}
                                    />
                                </div>
                                <div className="flex flex-col justify-center space-y-1">
                                    <p className="text-gray-700 font-light">Mode</p>
                                    <BlockOptions
                                        options={[
                                            {
                                                key: "TIME_BASED",
                                                value: "Time based",
                                            },
                                            {
                                                key: "TRIAL_BASED",
                                                value: "Trials based",
                                            },
                                        ]}
                                        label="roundMode"
                                        handleFormEntry={handleFormEntry}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div className="flex flex-col space-y-2 justify-center items-center py-2 fixed bottom-2 w-full">
                        <button
                            className={`flex justify-center items-center space-x-2 p-2 px-6 md:px-8 font-medium cursor-pointer rounded-lg border-2 ${!roomData?.isReady? "bg-green-50 border-green-500 text-green-600" : "bg-red-50 border-red-600 text-red-600"} w-3/4`}
                            onClick={
                                roomData?.isAdmin && roomData?.readyToStart
                                    ? createGame
                                    : toggleReadyStatus
                            }
                        >
                            {roomData?.isAdmin && roomData?.readyToStart
                                ? "Begin Game"
                                : roomData?.isReady
                                ? "Not Ready"
                                : "Ready"}
                        </button>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
