(() => {
    function getAppState() {
        try {
            return {
                client: eval("supabaseClient"),
                game: eval("game"),
                me: eval("me"),
                players: eval("players")
            };
        } catch (error) {
            return null;
        }
    }

    async function leaveSession() {
        const state = getAppState();

        if (!state || !state.game || !state.me || !state.client) {
            localStorage.removeItem("ww_game_id");
            localStorage.removeItem("ww_player_id");
            localStorage.removeItem("ww_player_name");
            location.reload();
            return;
        }

        if (!confirm("Sitzung wirklich verlassen?")) return;

        try {
            const { client, game, me, players } = state;

            if (me.is_host) {
                const nextHost = players
                    .filter(player => player.id !== me.id)
                    .sort((a, b) =>
                        new Date(a.created_at) - new Date(b.created_at)
                    )[0];

                if (nextHost) {
                    await client
                        .from("players")
                        .update({ is_host: true })
                        .eq("id", nextHost.id)
                        .eq("game_id", game.id);
                }
            }

            await client
                .from("votes")
                .delete()
                .eq("game_id", game.id)
                .eq("player_id", me.id);

            await client
                .from("players")
                .delete()
                .eq("id", me.id)
                .eq("game_id", game.id);

            localStorage.removeItem("ww_game_id");
            localStorage.removeItem("ww_player_id");
            localStorage.removeItem("ww_player_name");

            location.reload();
        } catch (error) {
            console.error(error);
            alert("Die Sitzung konnte nicht verlassen werden.");
        }
    }

    function addLeaveLink() {
        const active = document.querySelector(".screen.active");
        if (!active) return;

        if (active.id === "nameScreen") return;

        if (active.querySelector(".home-link")) return;

        const link = document.createElement("button");
        link.type = "button";
        link.className = "home-link";
        link.textContent = "← STARTSEITE";
        link.onclick = leaveSession;

        active.appendChild(link);
    }

    window.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent = `
            .home-link {
                display: block;
                margin: 16px auto 0;
                padding: 4px 8px;
                border: 0;
                background: transparent;
                color: rgba(255,255,255,.34);
                font-size: 10px;
                letter-spacing: .08em;
                cursor: pointer;
            }

            .home-link:hover {
                color: rgba(255,255,255,.65);
            }

            .leave-session-link:hover {
                color: rgba(255,255,255,.6);
            }
        `;
        document.head.appendChild(style);

        addLeaveLink();

        const observer = new MutationObserver(addLeaveLink);
        observer.observe(document.body, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ["class"]
        });
    });
})();