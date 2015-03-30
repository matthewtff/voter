#include "handler.hh"

#ifdef _WIN32
void SetHandler(int add, PHANDLER_ROUTINE routine) {
	SetConsoleCtrlHandler(routine, add);
}
#else /* _WIN32 */
void SetHandler(int sig, HandlerRet(* routine)(HandlerGet)) {
	signal(sig, routine);
}
#endif /* _WIN32 */
