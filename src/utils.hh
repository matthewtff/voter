#ifndef voter_utils_hh
#define voter_utils_hh

#include <cassert>
#include <type_traits>

namespace voter {

template <typename Record, typename Type>
class MethodChecker {
 public:
  using Callback = Type (Record::*)() const;
  using ConstCallback = typename std::add_const<Type>::type (Record::*)() const;
  MethodChecker(const Type& value, Callback callback)
      : MethodChecker(value) {
    callback_ = callback;
  }
  MethodChecker(const Type& value, ConstCallback const_callback)
      : MethodChecker(value) {
    const_callback_ = const_callback;
  }

  bool operator()(const Record& record) const {
    if (callback_) {
      return (&(record)->*callback_)() == value_;
    } else if (const_callback_) {
      return (&(record)->*const_callback_)() == value_;
    }
    assert(false && "At least one constant callback should be provided");
  }

 private:
  MethodChecker(const Type& value)
      : value_(value),
        callback_(nullptr),
        const_callback_(nullptr)
        {}

  const Type& value_;
  Callback callback_;
  ConstCallback const_callback_;
};  // class MethodChecker

template <typename Record, typename Type>
class FieldChecker {
 public:
  using Callback = Type Record::*;
  using ConstCallback = typename std::add_const<Type>::type Record::*;
  using VolatileCallback = typename std::add_volatile<Type>::type Record::*;
  FieldChecker(const Type& value, Callback callback)
      : FieldChecker(value) {
    callback_ = callback;
  }
  FieldChecker(const Type& value, ConstCallback const_callback)
      : FieldChecker(value) {
    const_callback_ = const_callback;
  }
  FieldChecker(const Type& value,
               VolatileCallback volatile_callback)
      : FieldChecker(value) {
    volatile_callback_ = volatile_callback;
  }

  bool operator()(const Record& record) const {
    if (callback_) {
      return (&(record)->*callback_)() == value_;
    } else if (const_callback_) {
      return (&(record)->*const_callback_)() == value_;
    } else if (volatile_callback_) {
      return (&(record)->*volatile_callback_)() == value_;
    }
    assert(false && "At least one constant callback should be provided");
  }

 private:
  FieldChecker(const Type& value)
      : value_(value),
        callback_(nullptr),
        const_callback_(nullptr),
        volatile_callback_(nullptr)
        {}

  const Type& value_;
  Callback callback_;
  ConstCallback const_callback_;
  VolatileCallback volatile_callback_;
};  // class MethodChecker

}  // namespace voter

#endif // voter_utils_hh

