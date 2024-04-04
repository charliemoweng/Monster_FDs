import React, { useState, useMemo, useEffect } from "react";
import { Typography } from "@mui/material";
import Closure from "../info_section/components/closure";

const Rules = () => {
    return (
        <div style={styles.mainContainer}>
            <Typography sx={styles.title}>Rules</Typography>
            <div style={styles.ruleContainer}>
                <div style={styles.ruleBox}>
                    <Typography sx={styles.ruleSubHeader}>
                        1. Strength Reprensetation
                    </Typography>

                    <Typography align="left">
                        indicates what combination of your monsters is stronger
                        than your opponent's. <br />
                        <br />
                        In this case, to kill monster C, you need both A and B
                    </Typography>
                    <br />
                    <Closure closure={["AB", "C"]} showPointer={false} />
                </div>
                <div style={styles.ruleBox}>
                    <Typography sx={styles.ruleSubHeader}>
                        2. Reflexitivity
                    </Typography>
                    <Typography align="left">
                        For monsters of the same type, yours will always be
                        stronger than the opponent's.
                    </Typography>
                    <br />
                    <Closure closure={["A", "A"]} showPointer={false} />
                </div>
                <div style={styles.ruleBox}>
                    <Typography sx={styles.ruleSubHeader}>
                        3. Transitivity
                    </Typography>
                    <Typography align="left">
                        The strength of a monster can propogate.
                        <br />
                        <br />
                        For example, monster A and B is stronger then C. C is
                        stronger than D. Therefore, A and B will be stronger
                        than D.
                    </Typography>
                    <br />
                    <Closure closure={["AB", "C"]} showPointer={false} />
                    <Closure closure={["C", "D"]} showPointer={false} />
                </div>
                <div style={styles.ruleBox}>
                    <Typography sx={styles.ruleSubHeader}>4. Goals</Typography>
                    <Typography align="left">
                        Find all the combinations of monsters that can
                        completely wipe your opponent's team with the least
                        amount of turns and monsters used.
                    </Typography>
                </div>
            </div>
        </div>
    );
};

const styles: any = {
    mainContainer: {
        width: "100%",
        border: "2px solid black",
        borderRadius: "10px",
        paddingBottom: "30px",
    },
    ruleContainer: {
        padding: "0px 30px",
    },
    ruleBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        marginTop: "30px",
    },
    ruleText: {
        textAlign: "left",
    },
    ruleSubHeader: {
        fontSize: "20px",
        fontWeight: "bold",
        textDecoration: "underline",
    },
    title: {
        fontSize: "30px",
        fontWeight: "bold",
    },
};

export default React.memo(Rules);
