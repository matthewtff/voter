#ifndef voter_handler_hh
#define voter_handler_hh

#ifdef _WIN32
#include <winsock2.h>

#define HandlerRet BOOL WINAPI
typedef DWORD HandlerGet;

static const DWORD QUIT_EVENT = CTRL_CLOSE_EVENT;
static const DWORD TERM_EVENT = CTRL_SHUTDOWN_EVENT;

void SetHandler(int add, PHANDLER_ROUTINE routine);
#else  /* _WIN32 */
#include <signal.h>

typedef void HandlerRet;
typedef int HandlerGet;

enum {
	CTRL_C_EVENT = SIGINT,
	QUIT_EVENT = SIGQUIT,
	TERM_EVENT = SIGTERM
};

void SetHandler(int sig, HandlerRet(* routine)(HandlerGet));
#endif  /* _WIN32 */

#endif  // voter_handler_hh
