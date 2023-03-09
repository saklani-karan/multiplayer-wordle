import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { MainLayout } from "../../../layouts/MainLayout";
import { useUserAuthContext } from "../../../context/UserAuthProvider";
import { client } from "../../../utils";
import { Check, Pin } from "../../../icons";
import { WorldeInput } from "../../../components/form/WordleInput";
import { Keyboard } from "../../../components/form/Keyboard";
import { over } from "stompjs";
import Image from "next/image";
import SockJS from "sockjs-client";
import { Dice } from "../../../icons/Dice";
import { Avatar } from "../../../components/display/Avatar";

let stompClient = null;
export default function Game() {
    const router = useRouter();
    const authContext = useUserAuthContext();
    const [gameInfo, setGameInfo] = useState({
        game: null,
        currentRound: null,
        completedForUser: false,
        roundCompleted: false,
        gameWinner: null,
        correctWord: null,
        score: null,
    });
    const [gameUser, setGameUser] = useState(null);
    const [word, setWord] = useState(["", "", "", "", ""]);
    const [showWinnerDialog, setShowWinnerDialog] = useState(false);
    const [showCorrectDialog, setShowCorrectDialog] = useState(false);
    const [showGameWinnerDialog, setShowGameWinnerDialog] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [submissions, setSubmissions] = useState([]);

    const RoundWinnerDialog = ({ winnerUser, correctWord }) => {
        if (winnerUser?.id == gameUser?.id) {
            return (
                <div className="flex flex-col bg-white p-10 rounded-lg space-y-4 justify-center items-center w-11/12">
                    <img src="/poppers-gif.gif" className="w-20 h-20" />

                    <div className="flex flex-col space-y-1">
                        <p className="text-center font-light text-xl font-raleway text-black">
                            Congratulations
                        </p>
                        <p className="text-center font-light text-base font-raleway text-black">
                            You've won the round
                        </p>
                    </div>
                    <div className="flex flex-col space-y-1">
                        <p className="text-center text-base  font-light font-raleway text-black">
                            The correct word is:
                        </p>
                        <p className="text-center text-lg font-bold font-raleway text-green-500">
                            {correctWord?.toUpperCase()}
                        </p>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex flex-col bg-white w-11/12 p-10 rounded-lg space-y-4 justify-center items-center">
                <div className="flex flex-col space-y-1 justify-center items-center">
                    <span className="w-10 h-10 text-red-400">
                        <Dice />
                    </span>
                    <p className="text-center font-light text-xl font-raleway text-black">
                        Better luck next time
                    </p>
                    <p className="text-center font-light text-base font-raleway text-black">
                        {winnerUser?.user?.name} has won the round
                    </p>
                </div>
                <div className="flex flex-col space-y-1">
                    <p className="text-center text-base  font-light font-raleway text-black">
                        The correct word is:
                    </p>
                    <p className="text-center text-lg font-bold font-raleway text-green-500">
                        {correctWord?.toUpperCase()}
                    </p>
                </div>
            </div>
        );
    };

    const GameWinnerDialog = ({ gameWinner, correctWord }) => {
        if (gameWinner?.id == gameUser?.user?.id) {
            return (
                <div className="flex flex-col bg-white p-10 rounded-lg space-y-4 justify-center items-center">
                    <img src="/poppers-gif.gif" className="w-20 h-20" />

                    <div className="flex flex-col space-y-1">
                        <p className="text-center font-light font-raleway text-black text-xl">
                            Congratulations!
                        </p>
                        <p className="text-center text-black text-base font-light font-raleway">
                            You've won the game!
                        </p>
                    </div>
                    <div className="flex flex-col space-y-1">
                        <p className="text-center text-base font-light text-black font-raleway">
                            The correct word for the last round was:
                        </p>
                        <p className="text-center text-lg font-bold font-raleway text-green-500">
                            {correctWord?.toUpperCase()}
                        </p>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex flex-col bg-white p-10 rounded-lg space-y-4 justify-center items-center">
                <div className="flex flex-col space-y-1 justify-center items-center">
                    <span className="w-10 h-10 text-red-500">
                        <Dice />
                    </span>
                    <p className="text-center font-light font-raleway text-black text-xl">
                        Better luck next time
                    </p>
                    <p className="text-center font-light font-raleway text-black">
                        {gameWinner?.name} has won the game!
                    </p>
                </div>
                <div className="flex flex-col space-y-1">
                    <p className="text-center font-light font-raleway text-black">
                        The correct word for the last is:
                    </p>
                    <p className="text-center text-lg font-bold font-raleway text-green-500">
                        {correctWord?.toUpperCase()}
                    </p>
                </div>
            </div>
        );
    };

    const getGame = async () => {
        const query = router.query;
        if (query?.id && authContext.getToken()) {
            try {
                const [currGameInfo, currGameUser] = await Promise.all([
                    client(
                        `${process.env.NEXT_PUBLIC_API_URL}/games/${query.id}`,
                        {
                            mode: "cors",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${authContext.getToken()}`,
                            },
                        }
                    ),
                    client(
                        `${process.env.NEXT_PUBLIC_API_URL}/games/${query.id}/me`,
                        {
                            mode: "cors",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${authContext.getToken()}`,
                            },
                        }
                    ),
                ]);
                setGameInfo({
                    game: currGameInfo?.game,
                    currentRound: currGameInfo?.currentRound,
                    completedForUser: currGameInfo?.completedForUser,
                    roundCompleted: currGameInfo?.roundCompleted,
                    roundWinner: currGameInfo?.roundWinner,
                    gameWinner: currGameInfo?.game?.winner,
                    gameCompleted: currGameInfo?.game?.gameCompleted,
                    score: currGameInfo?.score,
                });
                setSubmissions(currGameInfo?.submissionResponses || []);
                setGameUser(currGameUser);
            } catch (err) {}
        }
    };

    const handleNextRoundCreation = async () => {
        const query = router.query;
        try {
            await client(
                `${process.env.NEXT_PUBLIC_API_URL}/games/${query.id}/addRound`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authContext.getToken()}`,
                    },
                }
            );
            stompClient.send(
                "/app/game/nextRound",
                {},
                JSON.stringify({ gameId: gameInfo?.game?.id })
            );
        } catch (err) {}
    };

    const connect = () => {
        let Sock = new SockJS(process.env.NEXT_PUBLIC_WS_URL);
        stompClient = over(Sock);
        stompClient.connect({}, onConnected, onError);
    };

    const onConnected = () => {
        setTimeout(function () {
            stompClient.subscribe(
                "/game/" + gameInfo?.game?.id + "/round_winner",
                onRoundWinnerMessage
            );
            stompClient.subscribe(
                "/game/" + gameInfo?.game?.id + "/new_round",
                onNewRoundCreated
            );
            stompClient.subscribe(
                "/game/" + gameInfo?.game?.id + "/game_winner",
                onGameWinnerMessage
            );
            stompClient.subscribe(
                "/game/" + gameInfo?.game?.id + "/game_completed",
                onGameCompletedMessage
            );
            stompClient.subscribe(
                "/game/" + gameInfo?.game?.id + "/round_completed",
                onRoundCompletedMessage
            );
            setIsConnected(true);
        }, 500);
    };

    const onGameCompletedMessage = (payload) => {
        getGame();
    };

    const onRoundCompletedMessage = (payload) => {
        getGame();
    };

    const onRoundWinnerMessage = (payload) => {
        let body = null;
        try {
            body = JSON.parse(payload?.body);
        } catch (err) {
            console.log(err);
        }
        if (!body) {
            return;
        }
        const { correctWord, winner } = body;
        if (correctWord && winner) {
            setGameInfo({
                ...gameInfo,
                correctWord,
                roundWinner: winner,
                roundCompleted: true,
                completedForUser: true,
            });
            setShowWinnerDialog(true);
        }
    };

    const onGameWinnerMessage = (payload) => {
        let body = null;
        try {
            body = JSON.parse(payload?.body);
        } catch (err) {
            console.log(err);
        }
        if (!body) {
            return;
        }
        const { correctWord, winner, score } = body;
        if (correctWord && winner) {
            setGameInfo({
                ...gameInfo,
                correctWord,
                roundCompleted: true,
                completedForUser: true,
                gameCompleted: true,
                gameWinner: winner,
                score,
            });
            setShowGameWinnerDialog(true);
        }
    };

    const onNewRoundCreated = (payload) => {
        let body = null;
        try {
            body = JSON.parse(payload?.body);
        } catch (err) {
            console.log(err);
        }
        if (!body) {
            return;
        }
        getGame();
    };

    const handleRoundWinner = (winnerUser) => {
        if (!winnerUser) return;
        stompClient.send(
            "/app/game/roundWinner",
            {},
            JSON.stringify({ gameId: gameInfo?.game?.id })
        );
    };

    const onError = (err) => {
        console.log(err);
    };

    const handleGameWin = (gameWinner) => {
        if (!gameWinner) {
            return;
        }
        stompClient.send(
            "/app/game/gameWinner",
            {},
            JSON.stringify({ gameId: gameInfo?.game?.id })
        );
    };

    const handleGameCompleted = (gameCompleted) => {
        if (!gameCompleted) {
            return;
        }
        stompClient.send(
            "/app/game/gameCompleted",
            {},
            JSON.stringify({ gameId: gameInfo?.game?.id })
        );
    };

    const handleRoundCompleted = (roundCompleted) => {
        if (!roundCompleted) {
            return;
        }
        stompClient.send(
            "/app/game/roundCompleted",
            {},
            JSON.stringify({ gameId: gameInfo?.game?.id })
        );
    };

    const handleKeyPress = async (letter) => {
        const query = router.query;
        if (submissions.length >= 5) {
            return;
        }
        let insertIndex = word.length;
        for (let i = 0; i < word.length; i++) {
            if (word[i] === "") {
                insertIndex = i;
                break;
            }
        }
        if (letter === "ENTER") {
            if (insertIndex == word.length) {
                try {
                    const newSubmission = await client(
                        `${process.env.NEXT_PUBLIC_API_URL}/games/${query.id}/submit`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${authContext.getToken()}`,
                            },
                            body: JSON.stringify({
                                trial: word?.join(""),
                            }),
                        }
                    );
                    const {
                        trial,
                        responseMap,
                        isCorrect,
                        winnerUser,
                        roundCompleted,
                        completedForUser,
                        gameCompleted,
                        gameWinner,
                        score,
                    } = newSubmission;

                    setSubmissions([
                        ...submissions,
                        { trial: trial, responseMap: responseMap },
                    ]);
                    setGameInfo({
                        ...gameInfo,
                        completedForUser: isCorrect,
                        roundCompleted,
                        completedForUser,
                        roundWinner: winnerUser,
                        gameWinner,
                        score,
                        gameCompleted: gameCompleted || gameWinner,
                    });
                    if (gameWinner) {
                        handleGameWin(gameWinner);
                        setWord(["", "", "", "", ""]);
                        return;
                    }
                    if (winnerUser) {
                        if (
                            winnerUser?.id &&
                            gameUser?.id &&
                            winnerUser?.id === gameUser?.id
                        ) {
                            setShowWinnerDialog(true);
                        }
                        handleRoundWinner(winnerUser);
                    }
                    if (gameCompleted) {
                        handleGameCompleted(gameCompleted);
                    } else if (roundCompleted) {
                        handleRoundCompleted(roundCompleted);
                    }
                    setWord(["", "", "", "", ""]);
                } catch (err) {
                    console.log(err);
                }
            }
            else {
                return
            }
        }
        if (letter === "BACK") {
            if (insertIndex <= 0) {
                return;
            }
            const prevWord = [...word];
            prevWord[insertIndex - 1] = "";
            setWord(prevWord);
            return;
        }
        if (insertIndex >= word.length) {
            return;
        }
        const prevWord = [...word];
        prevWord[insertIndex] = letter;

        setWord(prevWord);
    };

    const handleReturnToMainMenu = () => {
        router.push("/");
    };

    useEffect(() => {
        if (!isConnected) {
            getGame();
        }
    }, [router.query, authContext.getToken()]);

    useEffect(() => {
        if (gameInfo && gameUser && !isConnected) {
            connect();
        }
    }, [gameInfo, gameUser]);

    console.log(gameInfo);

    return (
        <MainLayout>
            {showWinnerDialog && gameInfo?.roundWinner ? (
                <div
                    className="fixed h-full z-10 w-full justify-center flex items-center bg-black bg-opacity-50"
                    onClick={() => {
                        setShowWinnerDialog(false);
                    }}
                >
                    <RoundWinnerDialog
                        winnerUser={gameInfo.roundWinner}
                        correctWord={gameInfo.correctWord}
                    />
                </div>
            ) : null}
            {showGameWinnerDialog && gameInfo?.gameWinner ? (
                <div
                    className="fixed h-full z-10 w-full justify-center flex items-center bg-black bg-opacity-50"
                    onClick={() => {
                        setShowGameWinnerDialog(false);
                    }}
                >
                    <GameWinnerDialog
                        gameWinner={gameInfo.gameWinner}
                        correctWord={gameInfo.correctWord}
                    />
                </div>
            ) : null}

            {gameInfo.game ? (
                gameInfo?.gameCompleted ? (
                    <div className="flex flex-col space-y-2 justify-center items-center relative">
                        <div className="flex flex-col p-4 justify-center items-center space-y-0">
                            <img src="/check.gif" className="w-20 h-20" />
                            <p className="font-raleway font-bold text-center text-lg text-gray-700 ">
                                GAME COMPLETED
                            </p>
                        </div>
                        {gameInfo?.gameWinner ? (
                            <div className="flex flex-col p-4 py-2 justify-center items-center space-y-2">
                                <p className="text-xl font-light font-raleway text-gray-700">Winner</p>
                                <div className="flex flex-col justify-center items-center space-y-2">
                                    <Avatar
                                        user={gameInfo?.gameWinner}
                                        large={true}
                                    />
                                    <p className="text-base font-raleway font-light text-black">
                                        {gameInfo?.gameWinner?.name}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col p-4 py-2 justify-center items-center space-y-2">
                                <p className="text-lg font-light font-raleway text-gray-700">
                                    {" "}
                                    The game has been drawn
                                </p>
                            </div>
                        )}
                        {gameInfo?.score ? (
                            <div className="flex flex-col justify-center item-center p-4 space-y-2">
                                <p className="text-lg font-light font-raleway text-gray-700">
                                    Round scores
                                </p>
                                <div className="flex flex-col space-y-2">
                                    {gameInfo.score?.map((row)=>{
                                        return <div className="flex rounded-lg shadow-md bg-white p-4 justify-between items-center space-x-2">
                                            <div className="flex space-x-3 items-center">
                                                <img className="w-8 h-8 rounded-full" src={row?.user?.picture}/>
                                                <div className="flex flex-col">
                                                    <p className="font-raleway text-black">{row?.user?.name}</p>
                                                    <p className="font-raleway text-xs text-black font-light">{row?.user?.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-center items-center">
                                                <p className="text-lg font-raleway text-gray-700">{row.score}</p>
                                            </div>
                                        </div>
                                    })}
                                </div>
                            </div>
                        ) : null}
                        <button
                            className="p-4 bg-indigo-100 border border-indigo-700 w-3/4 text-indigo-700 rounded-lg font-raleway hover:bg-correct fixed bottom-4"
                            onClick={handleReturnToMainMenu}
                        >
                            Exit To Main Menu
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col space-y-4 relative">
                        <div className="flex justify-center items-center space-x-2">
                            {/* <span className="flex w-3 h-3 justify-center items-center">
                                <Pin />
                            </span> */}
                            <span className="text-xl font-raleway text-gray-700">
                                ROUND {gameInfo?.currentRound}
                            </span>
                        </div>
                        {submissions.map((submission) => {
                            return (
                                <div className="flex flex-col">
                                    <WorldeInput
                                        values={submission?.trial?.split("")}
                                        submission={submission.responseMap}
                                    />
                                </div>
                            );
                        })}
                        {5 - submissions?.length ? (
                            <div className="flex flex-col">
                                <WorldeInput values={word} />
                            </div>
                        ) : null}

                        {Array.from(
                            { length: 5 - 1 - submissions.length },
                            (_, i) => ["", "", "", "", ""]
                        ).map((entry) => {
                            return (
                                <div className="flex flex-col">
                                    <WorldeInput values={entry} />
                                </div>
                            );
                        })}
                        {gameInfo?.roundCompleted ? (
                            <div className="flex flex-col items-center justify-center space-y-2 py-4">
                                <div className="flex-col flex items-center justify-center">
                                    <span className="w-10 h-10 text-green-500">
                                        <Check />
                                    </span>
                                    <p className="text-lg font-bold font-raleway text-gray-700">
                                        Round has been completed
                                    </p>
                                </div>
                                {gameInfo?.roundWinner ? (
                                    <div className="flex-col flex items-center justify-center space-y-3">
                                        <p className="text-lg font-raleway font-light text-black text-center">
                                            Round has been won by:
                                        </p>
                                        <div className="flex flex-col justify-center items-center">
                                            <Avatar
                                                user={
                                                    gameInfo?.roundWinner?.user
                                                }
                                                large={true}
                                            />
                                            <p className="text-base font-light text-center text-black font-raleway">
                                                {
                                                    gameInfo?.roundWinner?.user
                                                        ?.name
                                                }
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-col flex">
                                        <p className="text-lg font-light text-center text-black font-raleway">
                                            The round has been drawn!
                                        </p>
                                    </div>
                                )}
                                <div className="flex justify-center items-center fixed bottom-4 w-full">
                                    <button
                                        className="rounded-lg p-2 bg-green-100 border border-green-600 font-bold font-raleway text-green-600 w-3/4"
                                        onClick={handleNextRoundCreation}
                                    >
                                        Next Round
                                    </button>
                                </div>
                            </div>
                        ) : gameInfo?.completedForUser ? (
                            <div className="flex flex-col p-4 justify-center items-center space-y-2">
                                <span className="w-10 h-10 text-green-500">
                                    <Check />
                                </span>
                                <p className="text-lg font-bold text-center text-gray-700 font-raleway">
                                    You have completed the round.
                                </p>
                                <p className="text-sm font-light text-center text-gray-700 font-raleway">
                                    Please wait for other users to finish the
                                    round.
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center fixed bottom-4 w-full">
                                <Keyboard handleKeyPress={handleKeyPress} />
                            </div>
                        )}
                    </div>
                )
            ) : null}
        </MainLayout>
    );
}
