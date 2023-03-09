import { Join, Play, User } from "../icons";
import { Leaderboard } from "../icons/Leaderboard";
import { MainLayout } from "../layouts/MainLayout";
import { useContext, useEffect, useState } from "react";
import { useUserAuthContext } from "../context/UserAuthProvider";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { client } from "../utils";
import { Modal } from "../components/modals/Modal";
import { Avatar } from "../components/display/Avatar";
import { Gamepad } from "../icons/Gamepad";
import { Dice } from "../icons/Dice";

export default function Home() {
    const authContext = useUserAuthContext();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isRoomInput, setIsRoomInput] = useState(false);
    const [userIncGames, setUserIncGames] = useState(null);

    const handleCreateRoom = async () => {
        try {
            const room = await client(
                `${process.env.NEXT_PUBLIC_API_URL}/rooms/create`,
                {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authContext.getToken()}`,
                    },
                }
            );
            console.log(room);
            router.push(`/room/${room.roomId}`);
        } catch (err) {
            toast.error(
                "An error occured while creating the room, please try again"
            );
        }
    };

    const EnterRoom = () => {
        const [roomNumber, setRoomNumber] = useState(null);
        const handleRoomInput = (event) => {
            const value = event.target.value;
            setRoomNumber(value);
        };

        return (
            <div className="flex-col flex space-y-4 items-center">
                <div className="flex space-x-2 items-center">
                    <p className="font-bold">Enter Room Number</p>
                    <input
                        className="outline-none focus:outline-none text-center focus:border focus:border-correct p-2 rounded-lg"
                        onChange={handleRoomInput}
                        value={roomNumber || ""}
                        type="number"
                    />
                </div>
                <button
                    className="flex justify-center items-center space-x-2 p-4 px-6 md:px-8 font-medium bg-correct cursor-pointer rounded-lg shadow-lg"
                    onClick={() => {
                        handleRoomJoin(roomNumber);
                    }}
                >
                    Join Room
                </button>
            </div>
        );
    };

    const handleRoomJoin = async (roomNumber) => {
        try {
            const room = await client(
                `${process.env.NEXT_PUBLIC_API_URL}/rooms/${roomNumber}/admit`,
                {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authContext.getToken()}`,
                    },
                }
            );
            console.log(room);
            router.push(`/room/${room.roomId}`);
        } catch (err) {
            toast.error(
                "An error occured while creating the room, please try again"
            );
        }
    };

    const fetchIncompleteGames = async () => {
        console.log(authContext.getToken());
        try {
            const incompleteGames = await client(
                `${process.env.NEXT_PUBLIC_API_URL}/games/list?isCompleted=false`,
                {
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authContext.getToken()}`,
                    },
                }
            );
            if (incompleteGames?.gamesData) {
                setUserIncGames(incompleteGames.gamesData);
            }
        } catch (err) {
            toast.error(
                "An error occured while creating the room, please try again"
            );
        }
    };

    const assignUser = () => {
        setUser(authContext.getUser());
    };

    useEffect(() => {
        if (authContext.getUser() && authContext.getToken()) {
            assignUser();
            fetchIncompleteGames();
        }
    }, [authContext.getUser(), authContext.getToken()]);

    return (
        <MainLayout>
            <div className="space-y-4 h-full justify-center items-center hidden lg:flex lg:flex-col">
                <p className="text-center font-bold text-lg">
                    Welcome to Multiplayer Wordle!
                </p>
                <div
                    className="flex items-center justify-center w-3/4 sm:w-1/2 md:1/3 lg:w-1/4 p-3 bg-correct rounded-lg shadow-lg space-x-2 hover:shadow-2xl cursor-pointer"
                    onClick={handleCreateRoom}
                >
                    <span className="w-3 h-3">
                        <Play />
                    </span>
                    <span className="font-semibold">Start Room</span>
                </div>
                <div
                    className="flex items-center justify-center  w-3/4 sm:w-1/2 md:1/3 lg:w-1/4 p-3 bg-correct rounded-lg shadow-lg space-x-2 hover:shadow-2xl cursor-pointer"
                    onClick={() => {
                        setIsRoomInput(true);
                    }}
                >
                    <span className="w-4 h-4">
                        <Join />
                    </span>
                    <span className="font-semibold">Join Room</span>
                </div>
                <div className="flex items-center justify-center  w-3/4 sm:w-1/2 md:1/3 lg:w-1/4 p-3 bg-correct rounded-lg shadow-lg space-x-2 hover:shadow-2xl cursor-pointer">
                    <span className="w-5 h-5">
                        <Leaderboard />
                    </span>
                    <span className="font-semibold">View Leaderboard</span>
                </div>
                <div className="flex items-center justify-center  w-3/4 sm:w-1/2 md:1/3 lg:w-1/4 p-3 bg-correct rounded-lg shadow-lg space-x-2 hover:shadow-2xl cursor-pointer">
                    <span className="w-4 h-4">
                        <User />
                    </span>
                    <span className="font-semibold">Invite Friends</span>
                </div>
                {isRoomInput ? (
                    <Modal
                        title={"Join Room"}
                        onClose={() => {
                            setIsRoomInput(false);
                        }}
                    >
                        <EnterRoom />
                    </Modal>
                ) : null}
            </div>
            <div className="flex flex-col px-2 space-y-4 py-2 lg:hidden relative">
                {/* <div className="flex flex-col justify-between border rounded-md overflow-hidden">
                    <div className="flex text-sm font-bold bg-white py-1 px-2 text-secondary">
                        Play
                    </div>
                    <div className="flex justify-center space-x-3">
                        <div
                            className="flex  flex-col items-center justify-center w-3/4 sm:w-1/2 md:1/3 lg:w-1/4 p-3 py-3 sm:py-6 bg-secondary rounded-lg shadow-lg space-x-2 hover:shadow-2xl cursor-pointer"
                            onClick={handleCreateRoom}
                        >
                            <span className="w-16 h-16 flex items-center">
                                <img src="/play.gif" />
                            </span>
                            <span className="font-semibold">Start Room</span>
                        </div>
                        <div
                            className="flex flex-col items-center justify-center  w-3/4 sm:w-1/2 md:1/3 lg:w-1/4 p-3 bg-secondary rounded-lg shadow-lg space-x-2 hover:shadow-2xl cursor-pointer"
                            onClick={() => {
                                setIsRoomInput(true);
                            }}
                        >
                            <span className="w-16 h-16 p-4">
                                <Join />
                            </span>
                            <span className="font-semibold">Join Room</span>
                        </div>
                    </div>
                </div> */}
                <div className="flex space-x-6 p-4 overflow-x-auto no-scrollbar">
                    <div className="flex flex-col  border-4 border-white rounded-3xl justify-center items-center overflow-hidden shadow-lg  min-w-fit" onClick={handleCreateRoom}>
                        <div className="bg-red-300 bg-opacity-80 flex justify-center items-center p-5 w-32 h-36">
                            <span className="w-20 h-24 flex items-center">
                                <img src="/play.gif" />
                            </span>
                        </div>
                        <div className="bg-white flex justify-center items-center p-2 w-full">
                            <p className="text-primary text-sm font-semibold text-red-500">Start Room</p>
                        </div>
                    </div>
                    <div className="flex flex-col  border-4 border-white rounded-3xl justify-center items-center overflow-hidden shadow-lg min-w-fit" onClick={()=>{setIsRoomInput(true)}}>
                        <div className="bg-blue-200 bg-opacity-80 flex justify-center items-center p-5 w-32 h-36">
                        <span className="w-14 h-14 text-blue-500 text-opacity-70">
                                <Join />
                            </span>
                        </div>
                        <div className="bg-white flex justify-center items-center p-2 w-full">
                            <p className="text-primary text-sm font-semibold text-blue-500">Join Room</p>
                        </div>
                    </div>
                    <div className="flex flex-col  border-4 border-white rounded-3xl justify-center items-center overflow-hidden shadow-lg min-w-fit">
                        <div className="bg-indigo-200 bg-opacity-80 flex justify-center items-center p-5 w-32 h-36">
                        <span className="w-14 h-14 text-indigo-500 text-opacity-70">
                                <Leaderboard />
                            </span>
                        </div>
                        <div className="bg-white flex justify-center items-center p-2 w-full">
                            <p className="text-primary text-sm font-semibold text-indigo-500">Leaderboard</p>
                        </div>
                    </div>
                </div>
                <div className="flex pt-4 xs:pt-6 p-4 w-full">
                    <div className="flex relative bg-banner rounded-2xl shadow-xl p-2 sm:p-4 px-6 items-center justify-start font-display w-full">
                        <div className="flex flex-col space-y-2 py-4 w-3/5 xs:w-full">
                            <p className="text-yellow-700">
                                Now play wordle with friends
                            </p>
                            <button className="rounded-lg shadow-lg bg-yellow-700 border-0 p-2 text-center text-sm w-full xs:w-1/2 font-light">
                                Create Room
                            </button>
                        </div>
                        
                        <img src="basketball.png" className="w-20 xs:w-20 bottom-0 right-3 absolute"/>
                    </div>
                </div>
                <div className="flex flex-col p-4 py-2 space-y-4">
                    <div className="flex space-x-4 items-center bg-indigo-100 p-2 rounded-xl shadow-lg">
                        <div className="flex justify-center items-center w-1/4">   
                            <div className="p-4 flex justify-center items-center bg-indigo-200 rounded-full w-16 h-16">
                                <span className="w-8 text-indigo-600 text-opacity-70 rounded-full">
                                    <Gamepad />
                                </span>
                            </div>
                        </div>
                       
                        <div className="flex justify-between items-center w-3/4">
                            <div className="flex flex-col space-y-0 text-indigo-900 justify-start">
                                <p className="text-base font-semibold">Active Games</p>
                                <p className="text-sm font-base">0 games</p>
                            </div>
                            <button className="rounded-lg shadow-xl bg-indigo-500 p-2 text-sm font-semibold text-white">
                                View Games
                            </button>
                        </div>
                    </div>
                    <div className="flex space-x-4 items-center bg-blue-100 p-2 rounded-xl shadow-lg">
                        <div className="flex justify-center items-center w-1/4">   
                            <div className="p-4 flex justify-center items-center bg-blue-200 rounded-full w-16 h-16">
                                <span className="w-8 text-blue-600 text-opacity-70 rounded-full">
                                    <Dice />
                                </span>
                            </div>
                        </div>
                       
                        <div className="flex justify-between items-center w-3/4">
                            <div className="flex flex-col space-y-0 text-blue-900 justify-start">
                                <p className="text-base font-semibold">Active Rooms</p>
                                <p className="text-sm font-base">0 rooms</p>
                            </div>
                            <button className="rounded-lg shadow-xl bg-blue-500 p-2 text-sm font-semibold text-gray-100">
                                View Rooms
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col p-4 py-2">
                <div className="flex justify-between items-center font-display font-semibold bg-banner p-2 px-4 rounded-lg shadow-lg">
                        <p className="text-yellow-700 font-semibold">
                            Invite friends for a game of multiplayer wordle
                        </p>
                        <button className="text-while bg-yellow-700 p-2 px-4 rounded-lg">
                            Invite
                        </button>
                    </div>
                </div>
                {isRoomInput ? (
                    <Modal
                        title={"Join Room"}
                        onClose={() => {
                            setIsRoomInput(false);
                        }}
                    >
                        <EnterRoom />
                    </Modal>
                ) : null}
                {/* <div className="flex flex-col justify-between border rounded-md overflow-hidden">
                    <div className="flex text-sm font-bold bg-white py-1 px-2 text-secondary">
                        Active Rooms
                    </div>
                    <div className="flex w-full justify-between space-x-3">
                        <div
                            className="flex  flex-col items-center justify-center w-3/4 sm:w-1/2 md:1/3 lg:w-1/4 p-3 bg-secondary rounded-lg shadow-lg space-x-2 hover:shadow-2xl cursor-pointer"
                            onClick={handleCreateRoom}
                        >
                            <span className="w-16 h-16 flex items-center">
                                <img src="/play.gif" />
                            </span>
                            <span className="font-semibold">Start Room</span>
                        </div>
                        <div
                            className="flex flex-col items-center justify-center  w-3/4 sm:w-1/2 md:1/3 lg:w-1/4 p-3 bg-secondary rounded-lg shadow-lg space-x-2 hover:shadow-2xl cursor-pointer"
                            onClick={() => {
                                setIsRoomInput(true);
                            }}
                        >
                            <span className="w-16 h-16 p-4">
                                <Join />
                            </span>
                            <span className="font-semibold">Join Room</span>
                        </div>
                    </div>
                    <div className="flex flex-col py-6">
                        <p className="text-center text-white">
                            You have no active rooms
                        </p>
                    </div>
                </div>
                <div className="flex flex-col space-y-2 justify-between border rounded-md overflow-hidden">
                    <div className="flex text-sm font-bold bg-white py-1 px-2 text-secondary">
                        Active Games
                    </div>
                    {!userIncGames?.length ? (
                        <div className="flex flex-col py-6">
                            <p className="text-center text-white">
                                You have no active games
                            </p>
                        </div>
                    ) : null}
                    {userIncGames?.length ? <div></div> : null}
                </div> */}
            </div>
        </MainLayout>
    );
}
