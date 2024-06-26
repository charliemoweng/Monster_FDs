import React, { useState, useMemo, useEffect } from "react";
import {
    GameInfoContext,
    GameInfoContextType,
    SetStates,
} from "../../hooks/GameInfoProvider";
import { Button, Alert } from "@mui/material";
import MonsterSelectionButton from "./components/monsterSelectionButton";
import Team from "./components/team";
import MatchEndDialogue from "./components/matchEndDialogue";
import { GiShardSword, GiNextButton } from "react-icons/gi";

type Props = {};

enum AlertStates {
    NONE,
    NO_MONSTERS_PICKED,
    TEAM_PICKED_BEFORE,
    WIN,
    LOSE,
    WIN_BUT_CANDIDATE_KEY_IS_SUPERSET,
    WIN_CANDIDATE_KEY_IS_SUBSET,
}

enum GameStates {
    SELECT_TEAM,
    WIN_ROUND,
    LOSE_ROUND,
    WIN_MATCH,
    LOSE_MATCH,
}

const FIGHT_CLOUD_ANIM_TIME = 2000; //its in miliseconds

const ArenaSection = (props: Props) => {
    const [currTeam, setCurrTeam] = useState<Set<string>>(new Set<string>());
    const [alertState, setAlertState] = useState<AlertStates>(AlertStates.NONE);
    const [showFightCloud, setShowFightCloud] = useState<boolean>(false);

    // to keep track of values after fighting
    const [enemiesDead, setEnemiesDead] = useState<Set<string>>(
        new Set<string>()
    );
    // to keep track of whether our team is subset/superset/or exact set of existing candidate keys
    const [teamState, setTeamState] = useState<SetStates>(SetStates.NOT_SET);
    const [currGameState, setCurrGameState] = useState<GameStates>(
        GameStates.SELECT_TEAM
    );

    const {
        matchInfo,
        wasTeamUsedBefore,
        fightOpponent,
        handleNewRound,
        handleNewMatch,
    } = React.useContext(GameInfoContext) as GameInfoContextType;

    const addTeamMember = (id: string) => {
        const newSet = new Set(currTeam);
        newSet.add(id);
        setCurrTeam(newSet);
    };

    const removeTeamMember = (id: string) => {
        const newSet = new Set(currTeam);
        newSet.delete(id);
        setCurrTeam(newSet);
    };

    const handleFight = () => {
        // check if it is empty
        if (currTeam.size === 0) {
            setAlertState(AlertStates.NO_MONSTERS_PICKED);
            return;
        }

        // check whether set already exists
        if (wasTeamUsedBefore(currTeam)) {
            setAlertState(AlertStates.TEAM_PICKED_BEFORE);
            return;
        }

        // show animation
        setShowFightCloud(true);
        setAlertState(AlertStates.NONE);

        setTimeout(() => {
            setShowFightCloud(false);
            // get closure and whether all the enemies were wiped out
            const { closure, state } = fightOpponent(currTeam);
            setEnemiesDead(closure);
            setTeamState(state);
        }, FIGHT_CLOUD_ANIM_TIME);
    };

    const startNewGame = (difficulty: number) => {
        // reset states
        setCurrTeam(new Set<string>());
        setEnemiesDead(new Set<string>());
        setCurrGameState(GameStates.SELECT_TEAM);
        setAlertState(AlertStates.NONE);

        // start new game
        handleNewMatch(difficulty);
    };

    useEffect(() => {
        if (matchInfo === null || enemiesDead.size === 0) return;
        // check round
        if (enemiesDead.size === matchInfo?.noOfAttributes) {
            setCurrGameState(GameStates.WIN_ROUND);
            console.log(teamState);

            // check if manage to win CURR ROUND (not the curr match)
            if (teamState === SetStates.SUPER_SET) {
                setAlertState(AlertStates.WIN_BUT_CANDIDATE_KEY_IS_SUPERSET);
            } else if (teamState === SetStates.SUB_SET) {
                setAlertState(AlertStates.WIN_CANDIDATE_KEY_IS_SUBSET);
            } else {
                setAlertState(AlertStates.WIN);
            }
        } else {
            setCurrGameState(GameStates.LOSE_ROUND);
            setAlertState(AlertStates.LOSE);
        }

        if (matchInfo === null) {
            return;
        }

        // check win lose condition for the entire match
        if (
            matchInfo.candidateNoOfKeysFound >= matchInfo.totalNoOfCandidateKeys
        ) {
            setCurrGameState(GameStates.WIN_MATCH);
            handleNewRound(); // HACK: just to restart the round count so the useeffects dependent on round will play
        } else if (matchInfo.currRoundNumber >= matchInfo.totalRounds) {
            setCurrGameState(GameStates.LOSE_MATCH);
            handleNewRound();
        }
    }, [enemiesDead, teamState]);

    const startNextRound = () => {
        // reset states
        setCurrTeam(new Set<string>());
        setEnemiesDead(new Set<string>());
        setCurrGameState(GameStates.SELECT_TEAM);
        setAlertState(AlertStates.NONE);

        // start next round
        handleNewRound();
    };

    const monsterTypes: Set<string> = useMemo(() => {
        const monsters = new Set<string>();
        if (matchInfo === null) return monsters;

        for (let i = 0; i < matchInfo.noOfAttributes; ++i) {
            let id = String.fromCharCode(64 + i + 1);
            monsters.add(id);
        }

        return monsters;
    }, [matchInfo?.noOfAttributes]);

    const renderAlerts = () => {
        return (
            <div style={styles.popup}>
                {alertState === AlertStates.NO_MONSTERS_PICKED && (
                    <Alert severity="error" sx={styles.alert}>
                        Your team is empty! You need to select at least 1
                        monster!
                    </Alert>
                )}
                {alertState === AlertStates.TEAM_PICKED_BEFORE && (
                    <Alert severity="warning" sx={styles.alert}>
                        You already selected this combination of monsters! Pick
                        a different combination.
                    </Alert>
                )}
                {alertState === AlertStates.WIN && (
                    <Alert severity="success" sx={styles.alert}>
                        Successfully defeated the enemy's team!
                    </Alert>
                )}
                {alertState ===
                    AlertStates.WIN_BUT_CANDIDATE_KEY_IS_SUPERSET && (
                    <Alert severity="warning" sx={styles.alert}>
                        You defeated the enemy team. But there's a smaller set
                        of monsters within your current team you could have
                        used. This is not counted as a combination found.
                    </Alert>
                )}
                {alertState === AlertStates.WIN_CANDIDATE_KEY_IS_SUBSET && (
                    <Alert severity="warning" sx={styles.alert}>
                        You defeated the enemy team! However, this combination
                        is a subset of an existing combination found, they are
                        counted as the same combination. Great work for finding
                        a smaller subset though!
                    </Alert>
                )}
                {alertState === AlertStates.LOSE && (
                    <Alert severity="error" sx={styles.alert}>
                        You were unable to full wipe the enemy's team and lost
                        this round...
                    </Alert>
                )}
            </div>
        );
    };

    const renderMonsterSelectionSection = useMemo(() => {
        const buttons: any[] = [];
        if (matchInfo === null) return;

        monsterTypes?.forEach((id) => {
            buttons.push(
                <MonsterSelectionButton
                    isDisabled={currGameState !== GameStates.SELECT_TEAM}
                    key={id}
                    id={id}
                    isSelected={currTeam.has(id)}
                    onClick={
                        currTeam.has(id) ? removeTeamMember : addTeamMember
                    }
                    style={styles.selectionButton}
                />
            );
        });

        return <div style={styles.selectionButtonContainer}>{buttons}</div>;
    }, [monsterTypes, currTeam, currGameState]);

    const renderFightCloud = () => {
        return (
            <img
                src={require(`../../assets/fightcloud.gif`)}
                alt={`fight cloud animation`}
                style={{
                    ...styles.fightCloud,
                }}
            />
        );
    };

    return (
        <div style={styles.container}>
            <div style={styles.backgroundImg} />
            <div style={styles.arenaContainer}>
                <Team
                    teamSize={matchInfo ? matchInfo.noOfAttributes : 0}
                    trainerName="player"
                    monsters={[...currTeam]}
                    flipSprites={true}
                    trainerIsOnRight={false}
                    deadMonsters={
                        currGameState === GameStates.LOSE_ROUND
                            ? monsterTypes
                            : undefined
                    }
                />
                <Team
                    teamSize={matchInfo ? matchInfo.noOfAttributes : 0}
                    trainerName="opponent"
                    monsters={Array.from(monsterTypes)}
                    flipSprites={false}
                    trainerIsOnRight={true}
                    deadMonsters={enemiesDead}
                />
            </div>
            <div style={styles.selectionContainer}>
                {renderMonsterSelectionSection}
                {currGameState === GameStates.SELECT_TEAM ? (
                    <Button
                        variant="contained"
                        onClick={handleFight}
                        sx={[styles.fightButton, styles.button]}
                    >
                        <GiShardSword size={40} />
                        Fight
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        onClick={startNextRound}
                        sx={[styles.nextRoundButton, styles.button]}
                    >
                        <GiNextButton />
                        Next Round
                    </Button>
                )}
                {renderAlerts()}

                <MatchEndDialogue
                    isOpen={
                        currGameState === GameStates.WIN_MATCH ||
                        currGameState === GameStates.LOSE_MATCH
                    }
                    isWin={currGameState === GameStates.WIN_MATCH}
                    totalMonsterCount={matchInfo?.currMonstersUsed ?? 0}
                    totalRoundsUsed={matchInfo?.currRoundNumber ?? 0}
                    combinationsFound={matchInfo?.candidateNoOfKeysFound ?? 0}
                    totalCombinations={matchInfo?.totalNoOfCandidateKeys ?? 0}
                    onStartNewGame={startNewGame}
                />
            </div>
            {showFightCloud && renderFightCloud()}
        </div>
    );
};

const styles: any = {
    container: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "auto",
        position: "relative",
    },
    backgroundImg: {
        width: "100%",
        height: "100%",
        position: "absolute",
        backgroundImage: `url(${require("../../assets/arenaBackground.avif")})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        filter: "blur(3px)",
        zIndex: -1,
        backgroundPosition: "50% 105%",
    },
    arenaContainer: {
        display: "flex",
        direction: "row",
        justifyContent: "space-between",
        borderWidth: "3px",
        borderColor: "black",
        margin: "60px",
    },
    selectionButtonContainer: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
    },
    selectionButton: {
        height: "100px",
        width: "100px",
    },
    selectionContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    button: {
        marginTop: "30px",
        width: "220px",
        height: "60px",
        justifyContent: "space-evenly",
        fontSize: 20,
        fontWeight: "bold",
    },
    fightButton: {
        backgroundColor: "#FF8C00",
        ":hover": {
            backgroundColor: "#E55A00",
        },
    },
    nextRoundButton: {
        backgroundColor: "#007DFF",
        ":hover": {
            backgroundColor: "#0060C3",
        },
    },
    popup: {
        marginTop: "30px",
        width: "800px",
        minHeight: "100px",
    },
    alert: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: 20,
        "& .MuiAlert-icon": {
            fontSize: 40,
        },
    },
    fightCloud: {
        position: "absolute",
        left: 0,
        right: 0,
        marginLeft: "auto",
        marginRight: "auto",
        width: "100%",
        height: "100%",
    },
};

export default React.memo(ArenaSection);
